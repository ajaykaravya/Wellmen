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
    const lastFetchedAtRef = useRef(0);
    const inFlightRef = useRef(false);

    useEffect(() => {
        previousIdsRef.current.clear();
        hasHydratedRef.current = false;
        lastFetchedAtRef.current = 0;

        if (!adminId) {
            setNotifications([]);
            return;
        }

        const shouldToast = Capacitor.getPlatform() === "web";
        let isMounted = true;

        const fetchNotifications = async (force = false) => {
            const now = Date.now();
            if (!force && now - lastFetchedAtRef.current < 60_000) return;
            if (inFlightRef.current) return;

            inFlightRef.current = true;
            lastFetchedAtRef.current = now;

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
            } finally {
                inFlightRef.current = false;
            }
        };

        fetchNotifications(true);

        const refreshOnFocus = () => {
            if (document.visibilityState === "visible") {
                fetchNotifications();
            }
        };

        const refreshOnDemand = () => {
            fetchNotifications(true);
        };

        window.addEventListener("focus", refreshOnFocus);
        document.addEventListener("visibilitychange", refreshOnFocus);
        window.addEventListener("wellmen:notifications-refresh", refreshOnDemand);

        return () => {
            isMounted = false;
            window.removeEventListener("focus", refreshOnFocus);
            document.removeEventListener("visibilitychange", refreshOnFocus);
            window.removeEventListener("wellmen:notifications-refresh", refreshOnDemand);
        };
    }, [adminId]);

    return { notifications };
}
