import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/rbac";
import { firestore } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const gate = await requireAuth(req);
  if (!gate.ok) return gate.res;

  const userId = gate.auth?.user?.id;
  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    if (!firestore) {
      return NextResponse.json(
        { error: "Firestore not initialized" },
        { status: 500 }
      );
    }

    const snapshot = await firestore
      .collection("notifications")
      .doc(userId)
      .collection("items")
      .orderBy("createdAt", "desc")
      .get();

    const notifications = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}
