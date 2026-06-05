// hooks/useNotifications.ts

import { createElement, useEffect, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { toast } from "react-toastify";

type NotificationItem = {
    id: string;
    title?: string;
    message?: string;
    createdAt?: unknown;
    isRead?: boolean;
    reportId?: string;
    [key: string]: unknown;
};

const renderNotificationMessage = (message: string) =>
    createElement("div", { style: { whiteSpace: "pre-line" } }, message);

export function useNotifications(adminId: string) {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const hasHydratedRef = useRef(false);
    const previousIdsRef = useRef(new Set<string>());

    useEffect(() => {
        if (!adminId) return;

        const shouldToast = Capacitor.getPlatform() === "web";
        let isMounted = true;

        const fetchNotifications = async () => {
            try {
                const response = await fetch("/api/notifications", {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                });

                if (!response.ok) {
                    console.error("Failed to fetch notifications:", response.statusText);
                    return;
                }

                const data = await response.json();
                const all = data.notifications || [];

                if (!isMounted) return;

                if (hasHydratedRef.current) {
                    // Show toast for newly added notifications
                    all.forEach((notif: NotificationItem) => {
                        if (!previousIdsRef.current.has(notif.id)) {
                            previousIdsRef.current.add(notif.id);
                            if (shouldToast) {
                                toast.info(
                                    renderNotificationMessage(
                                        notif.message || notif.title || "New notification",
                                    ),
                                    {
                                        toastId: `notif-${notif.id}`,
                                    },
                                );
                            }
                        }
                    });
                } else {
                    // First load - populate all IDs without toasting
                    all.forEach((notif: NotificationItem) => {
                        previousIdsRef.current.add(notif.id);
                    });
                    hasHydratedRef.current = true;
                }

                setNotifications(all);
            } catch (error) {
                console.error("Error fetching notifications:", error);
            }
        };

        // Fetch immediately
        fetchNotifications();

        // Set up polling interval (every 5 seconds)
        const interval = setInterval(fetchNotifications, 5000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [adminId]);

    return { notifications };
}
