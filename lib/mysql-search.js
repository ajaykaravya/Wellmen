import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const MYSQL_UNICODE_CI = "utf8mb4_unicode_ci";

/** Prisma model name -> searchable string columns */
const TABLE_COLUMNS = {
  Categories: ["category", "name"],
  Company: ["name", "code"],
  DailyReport: ["description"],
  DeviceToken: ["token", "platform", "deviceId"],
  ExpenseType: ["name"],
  FinanceTransaction: ["remark"],
  IncomeTransaction: ["remark"],
  IncomeType: ["name"],
  Permission: ["name"],
  PetiCash: ["remarks"],
  Project: ["name", "address", "city", "contactNumber", "email", "description"],
  ProjectForm: ["name"],
  QueryManagement: ["description"],
  Role: ["name"],
  Todo: ["description", "comments", "subCategory"],
  TransportConfig: ["configKey", "floor", "loadType", "tripType"],
  TransportLog: [
    "referenceNumber",
    "description",
    "locationType",
    "city",
    "floor",
    "loadType",
    "fromLocation",
    "toLocation",
    "mobileNumber",
    "vehicleNumber",
    "tripType",
    "vehicleType",
    "paymentMode",
    "status",
    "remark",
  ],
  User: [
    "email",
    "fullName",
    "username",
    "firstName",
    "lastName",
    "mobileNumber",
  ],
};

const assertSearchTarget = (table, column) => {
  const columns = TABLE_COLUMNS[table];
  if (!columns) {
    throw new Error(`Unsupported table for collation-safe search: ${table}`);
  }
  if (!columns.includes(column)) {
    throw new Error(`Unsupported column for collation-safe search: ${table}.${column}`);
  }
};

const buildEqualsClause = (column, value) =>
  Prisma.sql`${Prisma.raw(`\`${column}\``)} = ${value}`;

/**
 * Find row ids where a string column matches LIKE %query% using a single collation.
 * Optional `equals` filters apply as AND conditions (e.g. category = 'OFFICE_WORK').
 */
export async function findIdsByColumnContains(table, column, query, equals = {}) {
  assertSearchTarget(table, column);

  const pattern = `%${query}%`;
  const equalsEntries = Object.entries(equals);

  const whereClause =
    equalsEntries.length === 0
      ? Prisma.sql`${Prisma.raw(`\`${column}\``)} COLLATE ${Prisma.raw(MYSQL_UNICODE_CI)} LIKE ${pattern}`
      : Prisma.sql`${Prisma.join(
          [
            ...equalsEntries.map(([key, value]) => buildEqualsClause(key, value)),
            Prisma.sql`${Prisma.raw(`\`${column}\``)} COLLATE ${Prisma.raw(MYSQL_UNICODE_CI)} LIKE ${pattern}`,
          ],
          " AND ",
        )}`;

  const rows = await prisma.$queryRaw(
    Prisma.sql`
      SELECT id
      FROM ${Prisma.raw(table)}
      WHERE ${whereClause}
    `,
  );

  return rows.map((row) => row.id);
}
/**
 * Find ids where ANY of the listed columns on the same table match the query.
 */
export async function findIdsByAnyColumnContains(table, columns, query, equals = {}) {
  for (const column of columns) {
    assertSearchTarget(table, column);
  }

  const pattern = `%${query}%`;
  const equalsEntries = Object.entries(equals);
  const likeClauses = columns.map(
    (column) =>
      Prisma.sql`${Prisma.raw(`\`${column}\``)} COLLATE ${Prisma.raw(MYSQL_UNICODE_CI)} LIKE ${pattern}`,
  );

  const whereClause =
    equalsEntries.length === 0
      ? Prisma.sql`(${Prisma.join(likeClauses, " OR ")})`
      : Prisma.sql`${Prisma.join(
          [
            ...equalsEntries.map(([key, value]) => buildEqualsClause(key, value)),
            Prisma.sql`(${Prisma.join(likeClauses, " OR ")})`,
          ],
          " AND ",
        )}`;

  const rows = await prisma.$queryRaw(
    Prisma.sql`
      SELECT id
      FROM ${Prisma.raw(table)}
      WHERE ${whereClause}
    `,
  );

  return rows.map((row) => row.id);
}

/** Build `{ id: { in } }` filter; empty matches return no rows. */
export function buildInFilter(field, ids) {
  return { [field]: { in: ids.length > 0 ? ids : ["__no_match__"] } };
}
/**
 * Search a root table with optional LEFT JOINs, returning distinct root ids.
 *
 * joins: [{ alias, table, left: { alias, column }, right: { column } }]
 * orSearch: [{ alias, column }]
 * equals: root-table column filters, e.g. { transactionType: "EXPENSE" }
 */
export async function findIdsByMultiTableSearch({
  rootTable,
  rootAlias = "root",
  query,
  equals = {},
  joins = [],
  orSearch = [],
}) {
  const pattern = `%${query}%`;

  const joinParts = joins.map((join) =>
    Prisma.sql`LEFT JOIN ${Prisma.raw(join.table)} AS ${Prisma.raw(join.alias)} ON ${Prisma.raw(`${join.left.alias}.\`${join.left.column}\``)} = ${Prisma.raw(`${join.alias}.\`${join.right.column}\``)}`,
  );

  const equalsParts = Object.entries(equals).map(([column, value]) =>
    Prisma.sql`${Prisma.raw(`${rootAlias}.\`${column}\``)} = ${value}`,
  );

  const searchParts = orSearch.map(({ alias, column }) => {
    const table =
      alias === rootAlias
        ? rootTable
        : joins.find((join) => join.alias === alias)?.table;
    if (!table) {
      throw new Error(`Unknown search alias for collation-safe search: ${alias}`);
    }
    assertSearchTarget(table, column);
    return Prisma.sql`${Prisma.raw(`${alias}.\`${column}\``)} COLLATE ${Prisma.raw(MYSQL_UNICODE_CI)} LIKE ${pattern}`;
  });

  const whereParts = [...equalsParts];
  if (searchParts.length > 0) {
    whereParts.push(Prisma.sql`(${Prisma.join(searchParts, " OR ")})`);
  }

  const joinSql =
    joinParts.length > 0 ? Prisma.join(joinParts, " ") : Prisma.sql``;

  const rows = await prisma.$queryRaw(
    Prisma.sql`
      SELECT DISTINCT ${Prisma.raw(`${rootAlias}.id`)} AS id
      FROM ${Prisma.raw(rootTable)} AS ${Prisma.raw(rootAlias)}
      ${joinSql}
      WHERE ${Prisma.join(whereParts, " AND ")}
    `,
  );

  return rows.map((row) => row.id);
}
