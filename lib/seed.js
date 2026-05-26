import { prisma } from "@/lib/prisma";

export const DEFAULT_PERMISSIONS = [
  "create_user",
  "edit_user",
  "delete_user",
  "view_users",
  "manage_roles",
  "manage_permissions",
  "assign_roles",
  "view_reports",
  "manage_employees",
  "view_team",
  "update_profile",
];

export const DEFAULT_ROLES = [
  { name: "Admin", permissions: DEFAULT_PERMISSIONS },
  {
    name: "Manager",
    permissions: DEFAULT_PERMISSIONS,
  },
  { name: "Site supervisor", permissions: [] },
  { name: "Accountant", permissions: [] },
  { name: "Store Keeper", permissions: [] },
  { name: "Autocade", permissions: [] },
  { name: "Service Person", permissions: [] },
  { name: "Service Engineer", permissions: [] },
];

export const DEFAULT_COMPANIES = [
  {
    name: "Wellman Group",
    code: "WG",
  },
  {
    name: "Wellman Healthcare Services",
    code: "WHS",
  },
  {
    name: "Wellman Healthcare Infrastructure",
    code: "WHI",
  },
];

let defaultsPromise = null;

export async function ensureDefaults() {
  if (!defaultsPromise) {
    defaultsPromise = (async () => {
      for (const name of DEFAULT_PERMISSIONS) {
        await prisma.permission.upsert({
          where: { name },
          update: {},
          create: { name },
        });
      }

      for (const role of DEFAULT_ROLES) {
        const roleRecord = await prisma.role.upsert({
          where: { name: role.name },
          update: {},
          create: { name: role.name },
        });

        const permissionRecords = await prisma.permission.findMany({
          where: { name: { in: role.permissions } },
        });

        await prisma.rolePermission.createMany({
          data: permissionRecords.map((perm) => ({
            roleId: roleRecord.id,
            permissionId: perm.id,
          })),
          skipDuplicates: true,
        });
      }

      for (const company of DEFAULT_COMPANIES) {
        await prisma.company.upsert({
          where: { code: company.code },
          update: {
            name: company.name,
          },
          create: {
            name: company.name,
            code: company.code,
          },
        });
      }
    })();
  }

  return defaultsPromise;
}
