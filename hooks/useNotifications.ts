// hooks/useNotifications.ts

import { useEffect, useRef, useState } from "react";
import {
    collection,
    onSnapshot,
    query,
    orderBy,
} from "firebase/firestore";
import { Capacitor } from "@capacitor/core";
import { toast } from "react-toastify";
import { db } from "@/lib/firebase";

type NotificationItem = {
    id: string;
    title?: string;
    message?: string;
    createdAt?: unknown;
    isRead?: boolean;
    reportId?: string;
    [key: string]: unknown;
};

export function useNotifications(adminId: string) {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const hasHydratedRef = useRef(false);

    useEffect(() => {
        if (!adminId || !db) return;
        const shouldToast = Capacitor.getPlatform() === "web";

        const q = query(
            collection(db, "notifications", adminId, "items"),
            orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const all = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...(doc.data() as Omit<NotificationItem, "id">),
            })) as NotificationItem[];

            if (hasHydratedRef.current) {
                snapshot.docChanges().forEach((change) => {
                    if (change.type !== "added") return;
                    const data = {
                        id: change.doc.id,
                        ...(change.doc.data() as Omit<NotificationItem, "id">),
                    } as NotificationItem;

                    if (shouldToast) {
                        toast.info(
                            data.message || data.title || "New notification",
                            {
                                toastId: `notif-${change.doc.id}`,
                            },
                        );
                    }
                });
            } else {
                hasHydratedRef.current = true;
            }

            setNotifications(all);
        });

        return () => unsubscribe();
    }, [adminId]);

    return { notifications };
}
