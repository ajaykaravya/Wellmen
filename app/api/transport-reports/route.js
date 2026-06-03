import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import {
  TRANSPORT_TYPES,
  calculateTransportTotalAmount,
  getTransportTypeLabel,
} from "@/lib/transport-management";

const parseMonthYearValue = (yearValue, monthValue) => {
  const year = Number(String(yearValue || "").trim());
  const monthIndex = Number(String(monthValue || "").trim()) - 1;

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(monthIndex) ||
    monthIndex < 0 ||
    monthIndex > 11
  ) {
    return null;
  }

  const start = new Date(year, monthIndex, 1, 0, 0, 0, 0);
  if (Number.isNaN(start.getTime())) return null;

  const end = new Date(year, monthIndex + 1, 1, 0, 0, 0, 0);
  return {
    year,
    month: String(monthIndex + 1).padStart(2, "0"),
    yearMonth: `${year}-${String(monthIndex + 1).padStart(2, "0")}`,
    start,
    end,
  };
};

const getCurrentPeriodValue = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return { year, month };
};

export async function GET(req) {
  const gate = await requireRole(req, ["Admin", "Manager"]);
  if (!gate.ok) return gate.res;

  try {
    const { searchParams } = new URL(req.url);
    const currentPeriod = getCurrentPeriodValue();
    const yearParam = searchParams.get("year");
    const monthParam = searchParams.get("month");
    const selectedMonth =
      parseMonthYearValue(yearParam, monthParam) ||
      parseMonthYearValue(currentPeriod.year, currentPeriod.month);

    if (!selectedMonth) {
      return NextResponse.json(
        { error: "Invalid year or month filter." },
        { status: 400 },
      );
    }

    const [logs, dateBounds] = await Promise.all([
      prisma.transportLog.findMany({
        where: {
          date: {
            gte: selectedMonth.start,
            lt: selectedMonth.end,
          },
        },
        select: {
          transportType: true,
          driverWages: true,
          otherExpenses: true,
          floorRent: true,
          returnMaterialFreight: true,
          weightCharge: true,
          coverCharge: true,
          baseAmount: true,
          gstAmount: true,
          tripCharge: true,
          loadingCharges: true,
          returnMaterialCharges: true,
          transportCharges: true,
        },
      }),
      prisma.transportLog.aggregate({
        _min: { date: true },
        _max: { date: true },
      }),
    ]);

    const summaryMap = new Map(
      TRANSPORT_TYPES.map((item) => [
        item.key,
        {
          transportType: item.key,
          module: item.label,
          totalTrips: 0,
          totalAmount: 0,
        },
      ]),
    );

    for (const log of logs) {
      const current = summaryMap.get(log.transportType);
      if (!current) continue;

      current.totalTrips += 1;
      current.totalAmount += calculateTransportTotalAmount(log);
    }

    const data = TRANSPORT_TYPES.map((item) => {
      const row = summaryMap.get(item.key);
      return {
        transportType: item.key,
        module: getTransportTypeLabel(item.key),
        totalTrips: row?.totalTrips ?? 0,
        totalAmount: Number((row?.totalAmount ?? 0).toFixed(2)),
      };
    });

    const totals = data.reduce(
      (acc, row) => {
        acc.totalTrips += row.totalTrips;
        acc.totalAmount += row.totalAmount;
        return acc;
      },
      { totalTrips: 0, totalAmount: 0 },
    );

    const minYear = dateBounds._min.date?.getFullYear();
    const maxYear = dateBounds._max.date?.getFullYear();
    const availableYears =
      Number.isFinite(minYear) && Number.isFinite(maxYear)
        ? Array.from(
            { length: maxYear - minYear + 1 },
            (_, index) => minYear + index,
          )
        : [currentPeriod.year];

    return NextResponse.json({
      year: selectedMonth.year,
      month: selectedMonth.month,
      yearMonth: selectedMonth.yearMonth,
      availableYears,
      data,
      totals: {
        totalTrips: totals.totalTrips,
        totalAmount: Number(totals.totalAmount.toFixed(2)),
      },
    });
  } catch (error) {
    console.error("Failed to load transport reports", error);
    return NextResponse.json(
      { error: error.message || "Failed to load transport reports." },
      { status: 400 },
    );
  }
}
