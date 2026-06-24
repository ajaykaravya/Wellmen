const TRANSACTION_TYPES = ["CREDIT", "DEBIT"];
const PAYMENT_MODES = ["CASH", "BANK", "CHEQUE", "UPI", "NEFT_RTGS"];

export const PETI_CASH_INCLUDE = {
  givenBy: { include: { role: true } },
  givenTo: { include: { role: true } },
  company: true,
  project: true,
  expenseType: {
    include: {
      expenseTypeUsers: {
        include: {
          user: true,
        },
      },
    },
  },
  dailyExpense: true,
};

export const isValidTransactionType = (value) =>
  TRANSACTION_TYPES.includes(value);

export const isValidPaymentMode = (value) => PAYMENT_MODES.includes(value);

export const parseBoolean = (value, fallback = false) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (!normalized) return fallback;
    if (["true", "1", "yes", "y", "on"].includes(normalized)) return true;
    if (["false", "0", "no", "n", "off"].includes(normalized)) return false;
  }
  return fallback;
};

export const parsePetiCashPayload = (body) => {
  const amountRaw = String(body.amount || "").trim();
  const transactionType = String(body.transactionType || "")
    .trim()
    .toUpperCase();
  const givenById = String(body.givenById || "").trim();
  const givenToId = String(body.givenToId || "").trim();
  const companyId = String(body.companyId || "").trim();
  const projectId = String(body.projectId || "").trim();
  const expenseTypeId = String(body.expenseTypeId || "").trim();
  const isAdvance = parseBoolean(body.isAdvance, true);
  const paymentMode = String(body.paymentMode || "")
    .trim()
    .toUpperCase();
  const date = String(body.date || "").trim();
  const remarks = String(body.remarks || "").trim();

  return {
    amountRaw,
    transactionType,
    givenById,
    givenToId,
    companyId,
    projectId,
    expenseTypeId,
    isAdvance,
    paymentMode,
    date,
    remarks,
  };
};

export const parseDate = (value) => {
  if (!value) return null;

  const ddmmyyyy = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (ddmmyyyy) {
    const [, day, month, year] = ddmmyyyy;
    const date = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      12,
      0,
      0,
    );
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const serializePetiCash = (row) => ({
  id: row.id,
  transactionType: row.transactionType,
  amount: Number(row.amount),
  isAdvance: row.isAdvance,
  givenById: row.givenById,
  givenByName: row.givenBy?.fullName || null,
  givenByRole: row.givenBy?.role?.name || null,
  givenToId: row.givenToId,
  givenToName: row.givenTo?.fullName || null,
  givenToRole: row.givenTo?.role?.name || null,
  companyId: row.companyId,
  companyName: row.company?.name || null,
  companyCode: row.company?.code || null,
  projectId: row.projectId,
  projectName: row.project?.name || null,
  projectCity: row.project?.city || null,
  expenseTypeId: row.expenseTypeId,
  expenseTypeName: row.expenseType?.name || null,
  dailyExpense: row.dailyExpense
    ? {
        id: row.dailyExpense.id,
        paymentMode: row.dailyExpense.paymentMode || null,
      }
    : null,
  date: row.date,
  remarks: row.remarks || null,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

export const validatePetiCashParticipants = ({
  transactionType,
  isAdvance,
  givenBy,
  givenTo,
  expenseType,
}) => {
  if (transactionType === "CREDIT") {
    if (givenBy.role?.name !== "Admin") {
      return "Given by must be Admin for Add Cash.";
    }
    if (givenTo.role?.name !== "Manager") {
      return "Given to must be Manager for Add Cash.";
    }
    return null;
  }

  if (givenBy.role?.name !== "Manager") {
    return "Given by must be Manager for Give Cash.";
  }

  if (isAdvance) {
    if (givenTo.role?.name === "Admin" || givenTo.role?.name === "Manager") {
      return "Given to must be Employee for Give Cash.";
    }
    return null;
  }

  const allowedUserIds = new Set(
    (expenseType?.expenseTypeUsers || [])
      .map((item) => item.user?.id)
      .filter(Boolean),
  );

  if (!allowedUserIds.has(givenTo.id)) {
    return "Given to must belong to the selected expense category.";
  }

  return null;
};

export const syncLinkedDailyExpense = async ({
  tx,
  petiCashId,
  existingDailyExpense,
  transactionType,
  isAdvance,
  amount,
  givenToId,
  companyId,
  projectId,
  expenseTypeId,
  paymentMode,
  date,
  remarks,
}) => {
  if (transactionType !== "DEBIT" || isAdvance) {
    if (existingDailyExpense) {
      await tx.petiCash.update({
        where: { id: petiCashId },
        data: {
          dailyExpense: {
            delete: true,
          },
        },
      });
    }
    return null;
  }

  const dailyExpenseData = {
    amount,
    transactionType: "EXPENSE",
    expenseTypeId,
    expenseById: givenToId,
    expenseCompanyId: companyId,
    projectId: projectId || null,
    paymentMode,
    date,
    remark: remarks || null,
  };

  if (existingDailyExpense) {
    return tx.petiCash.update({
      where: { id: petiCashId },
      data: {
        dailyExpense: {
          update: dailyExpenseData,
        },
      },
    });
  }

  return tx.petiCash.update({
    where: { id: petiCashId },
    data: {
      dailyExpense: {
        create: dailyExpenseData,
      },
    },
  });
};
