import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { error: "Super Admin API has been deprecated. Use RBAC APIs instead." },
    { status: 410 }
  );
}

export async function POST() {
  return NextResponse.json(
    { error: "Super Admin API has been deprecated. Use RBAC APIs instead." },
    { status: 410 }
  );
}
