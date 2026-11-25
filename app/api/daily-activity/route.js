import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

// Everything that happened on one day, grouped by project, for the admin
// "Daily Activity" page.
//
// Days are Indian Standard Time days: the app is used in India but Vercel runs
// in UTC, so a plain UTC day would move anything done before 05:30 IST onto
// the previous date.
//
// Which timestamp decides "the day" for each kind of activity:
// - money (income, petty cash, expenses): the transaction's own `date`, i.e.
//   the day the money moved, which is what the cash pages show too;
// - daily reports: `reportDate`;
// - tasks: `createdAt` (created) and `completedDate` (completed);
// - drawings, queries: `createdAt`;
// - forms: `updatedAt` of saved (COMPLETED) forms - form saves never set
//   `submittedAt`, and PENDING rows are the empty placeholders created along
//   with a new project;
// - projects: `createdAt`;
// - documents: the `uploadedAt` stamped on each file inside the form's data.

const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

const todayInIst = () =>
  new Date(Date.now() + IST_OFFSET_MS).toISOString().slice(0, 10);

const getIstDayRange = (value) => {
  const match = DATE_RE.exec(value);
  if (!match) return null;
  const [, y, m, d] = match.map(Number);
  const utcMidnight = Date.UTC(y, m - 1, d);
  const check = new Date(utcMidnight);
  if (check.getUTCFullYear() !== y || check.getUTCMonth() !== m - 1) return null;
  const start = new Date(utcMidnight - IST_OFFSET_MS);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
};

const money = (value) => (value == null ? null : Number(value));
const userName = (user) => user?.fullName || null;
const humanize = (value) =>
  value
    ? String(value)
        .toLowerCase()
        .replace(/_/g, " ")
        .replace(/^\w/, (c) => c.toUpperCase())
    : null;
const join = (...parts) => parts.filter(Boolean).join(" · ") || null;
const projectLabel = (project) =>
  project ? (project.city ? `${project.name} (${project.city})` : project.name) : null;

// Walks a form's saved JSON and returns every uploaded-file entry in it.
// Upload entries look like { url, name, size, fileType, uploadedAt }.
const collectUploadedFiles = (node, out = []) => {
  if (Array.isArray(node)) {
    node.forEach((item) => collectUploadedFiles(item, out));
  } else if (node && typeof node === "object") {
    if (typeof node.url === "string" && typeof node.uploadedAt === "string") {
      out.push(node);
    }
    Object.values(node).forEach((value) => collectUploadedFiles(value, out));
  }
  return out;
};

const PROJECT_SELECT = { select: { id: true, name: true, city: true } };

export async function GET(req) {
  const gate = await requireRole(req, ["Admin", "Manager"]);
  if (!gate.ok) return gate.res;

  const { searchParams } = new URL(req.url);
  const date = String(searchParams.get("date") || "").trim() || todayInIst();
  const range = getIstDayRange(date);
  if (!range) {
    return NextResponse.json(
      { error: "Invalid date. Use YYYY-MM-DD." },
      { status: 400 },
    );
  }
  const inDay = { gte: range.start, lt: range.end };

  try {
    const [
      drawings,
      tasksCreated,
      tasksCompleted,
      reports,
      queries,
      income,
      petiCash,
      expenses,
      submissions,
      projectsCreated,
    ] = await Promise.all([
      prisma.projectDrawing.findMany({
        where: { createdAt: inDay },
        include: { project: PROJECT_SELECT, drawingCategory: true, uploadedBy: true },
      }),
      prisma.todo.findMany({
        where: { createdAt: inDay },
        include: { project: PROJECT_SELECT, category: true, createdBy: true, assignee: true },
      }),
      prisma.todo.findMany({
        where: { status: "COMPLETED", completedDate: inDay },
        include: { project: PROJECT_SELECT, category: true, createdBy: true, assignee: true },
      }),
      prisma.dailyReport.findMany({
        where: { reportDate: inDay },
        include: { project: PROJECT_SELECT, category: true, createdBy: true },
      }),
      prisma.queryManagement.findMany({
        where: { createdAt: inDay },
        include: { project: PROJECT_SELECT, createdBy: true },
      }),
      prisma.incomeTransaction.findMany({
        where: { date: inDay },
        include: { project: PROJECT_SELECT, incomeType: true, incomeCompany: true, receivedBy: true },
      }),
      prisma.petiCash.findMany({
        where: { date: inDay },
        include: { project: PROJECT_SELECT, expenseType: true, company: true, givenBy: true, givenTo: true },
      }),
      // Expense claims also create a linked expense row (petiCashId set);
      // those are reported once, from the petty cash side.
      prisma.financeTransaction.findMany({
        where: { date: inDay, transactionType: "EXPENSE", petiCashId: null },
        include: { project: PROJECT_SELECT, expenseType: true, expenseCompany: true, expenseBy: true },
      }),
      prisma.projectFormSubmission.findMany({
        where: { status: "COMPLETED", updatedAt: inDay },
        include: { project: PROJECT_SELECT, projectForm: { select: { name: true } } },
      }),
      prisma.project.findMany({
        where: { createdAt: inDay },
        select: { id: true, name: true, city: true, status: true, createdAt: true, User: true },
      }),
    ]);

    const activities = [];
    const add = (row, item) =>
      activities.push({
        projectId: row.project?.id || null,
        projectName: projectLabel(row.project),
        by: null,
        detail: null,
        amount: null,
        fileUrl: null,
        ...item,
        at: new Date(item.at).toISOString(),
      });

    projectsCreated.forEach((row) =>
      add(
        { project: row },
        {
          id: `project-${row.id}`,
          type: "PROJECT_CREATED",
          group: "tasks",
          at: row.createdAt,
          title: projectLabel(row),
          detail: humanize(row.status),
          by: userName(row.User),
        },
      ),
    );

    drawings.forEach((row) =>
      add(row, {
        id: `drawing-${row.id}`,
        type: "DRAWING_UPLOADED",
        group: "files",
        at: row.createdAt,
        title: row.fileName,
        detail: join(row.drawingCategory?.name, row.fileType),
        by: userName(row.uploadedBy),
        fileUrl: row.fileUrl,
      }),
    );

    const taskTitle = (row) =>
      row.description || join(row.category?.name, row.subCategory) || "Task";

    tasksCreated.forEach((row) =>
      add(row, {
        id: `task-created-${row.id}`,
        type: "TASK_CREATED",
        group: "tasks",
        at: row.createdAt,
        title: taskTitle(row),
        detail: join(
          humanize(row.type),
          `${humanize(row.priority)} priority`,
          row.assignee ? `Assigned to ${row.assignee.fullName}` : null,
        ),
        by: userName(row.createdBy),
      }),
    );

    tasksCompleted.forEach((row) =>
      add(row, {
        id: `task-completed-${row.id}`,
        type: "TASK_COMPLETED",
        group: "tasks",
        // completedDate is often date-only; updatedAt is when it was marked.
        at: row.updatedAt,
        title: taskTitle(row),
        detail: join(humanize(row.type), row.category?.name),
        by: userName(row.assignee) || userName(row.createdBy),
      }),
    );

    reports.forEach((row) =>
      add(row, {
        id: `report-${row.id}`,
        type: "REPORT_SUBMITTED",
        group: "reports",
        at: row.createdAt,
        title: row.category?.name || "Daily report",
        detail: row.description,
        by: userName(row.createdBy),
      }),
    );

    queries.forEach((row) =>
      add(row, {
        id: `query-${row.id}`,
        type: "QUERY_RAISED",
        group: "reports",
        at: row.createdAt,
        title: humanize(row.category),
        detail: join(`${humanize(row.priority)} priority`, row.description),
        by: userName(row.createdBy),
      }),
    );

    income.forEach((row) =>
      add(row, {
        id: `income-${row.id}`,
        type: "CASH_RECEIVED",
        group: "money",
        at: row.createdAt,
        title: row.incomeType?.name || "Income",
        detail: join(row.incomeCompany?.name, humanize(row.paymentMode), row.remark),
        by: userName(row.receivedBy),
        amount: money(row.amount),
      }),
    );

    petiCash.forEach((row) => {
      const isClaim = row.transactionType === "DEBIT" && row.isAdvance === false;
      const isAdvance = row.transactionType === "DEBIT" && !isClaim;
      const to = userName(row.givenTo);
      add(row, {
        id: `peti-${row.id}`,
        type: isClaim ? "EXPENSE_CLAIMED" : isAdvance ? "ADVANCE_GIVEN" : "CASH_GIVEN",
        group: "money",
        at: row.createdAt,
        title: isClaim
          ? row.expenseType?.name || "Expense claim"
          : to
            ? `To ${to}`
            : "Petty cash",
        detail: join(
          isClaim && to ? `Claimed by ${to}` : null,
          row.company?.name,
          row.remarks,
        ),
        by: isClaim ? to : userName(row.givenBy),
        amount: money(row.amount),
      });
    });

    expenses.forEach((row) =>
      add(row, {
        id: `expense-${row.id}`,
        type: row.paymentMode === "CASH" ? "CASH_SPENT" : "EXPENSE_PAID",
        group: "money",
        at: row.createdAt,
        title: row.expenseType?.name || "Expense",
        detail: join(row.expenseCompany?.name, humanize(row.paymentMode), row.remark),
        by: userName(row.expenseBy),
        amount: money(row.amount),
      }),
    );

    submissions.forEach((row) => {
      const formName = row.projectForm?.name || "Form";
      add(row, {
        id: `form-${row.id}`,
        type: "FORM_FILLED",
        group: "files",
        at: row.updatedAt,
        title: formName,
      });

      const seen = new Set();
      collectUploadedFiles(row.formData).forEach((file) => {
        const uploadedAt = new Date(file.uploadedAt);
        if (
          Number.isNaN(uploadedAt.getTime()) ||
          uploadedAt < range.start ||
          uploadedAt >= range.end ||
          seen.has(file.url)
        ) {
          return;
        }
        seen.add(file.url);
        add(row, {
          id: `document-${row.id}-${seen.size}`,
          type: "DOCUMENT_UPLOADED",
          group: "files",
          at: uploadedAt,
          title: file.name || "Document",
          detail: join(formName, file.fileType),
          fileUrl: file.url,
        });
      });
    });

    activities.sort((a, b) => b.at.localeCompare(a.at));

    const totalsFor = (list) => {
      const totals = {
        cashReceived: 0,
        cashGiven: 0,
        expensesPaid: 0,
        expensesClaimed: 0,
        counts: {},
      };
      list.forEach((item) => {
        totals.counts[item.type] = (totals.counts[item.type] || 0) + 1;
        const amount = item.amount || 0;
        if (item.type === "CASH_RECEIVED") totals.cashReceived += amount;
        if (item.type === "CASH_GIVEN" || item.type === "ADVANCE_GIVEN")
          totals.cashGiven += amount;
        if (item.type === "CASH_SPENT" || item.type === "EXPENSE_PAID")
          totals.expensesPaid += amount;
        if (item.type === "EXPENSE_CLAIMED") totals.expensesClaimed += amount;
      });
      return totals;
    };

    const byProject = new Map();
    activities.forEach((item) => {
      const key = item.projectId || "none";
      if (!byProject.has(key)) {
        byProject.set(key, {
          projectId: item.projectId,
          projectName: item.projectName || "No project (office / general)",
          activities: [],
        });
      }
      byProject.get(key).activities.push(item);
    });

    // Busiest projects first; activity with no project goes last.
    const projects = [...byProject.values()]
      .map((group) => ({ ...group, totals: totalsFor(group.activities) }))
      .sort((a, b) => {
        if (!a.projectId !== !b.projectId) return a.projectId ? -1 : 1;
        return b.activities.length - a.activities.length;
      });

    return NextResponse.json({
      date,
      today: todayInIst(),
      totals: { ...totalsFor(activities), activities: activities.length },
      projects,
    });
  } catch (error) {
    console.error("GET daily activity failed", error);
    return NextResponse.json(
      { error: "Failed to load daily activity." },
      { status: 500 },
    );
  }
}
