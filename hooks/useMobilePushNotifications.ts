"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Capacitor } from "@capacitor/core";
import {
  PushNotificationSchema,
  PushNotifications,
  Token,
} from "@capacitor/push-notifications";
import { toast } from "react-toastify";

const TOKEN_STORAGE_KEY = "wellmen-fcm-token";

async function registerToken(token: string, platform: string) {
  await fetch("/api/push-tokens", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token, platform }),
  });
}

export async function deactivateCurrentPushToken() {
  if (typeof window === "undefined" || Capacitor.getPlatform() === "web") {
    return;
  }

  const token = window.localStorage.getItem(TOKEN_STORAGE_KEY);
  if (!token) return;

  try {
    await fetch("/api/push-tokens", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    });
  } finally {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

export function useMobilePushNotifications(
  enabled: boolean,
  userId: string,
) {
  const router = useRouter();
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!enabled || !userId) return;
    if (Capacitor.getPlatform() === "web") return;
    if (initializedRef.current) return;

    initializedRef.current = true;
    let isMounted = true;

    const run = async () => {
      try {
        const permission = await PushNotifications.checkPermissions();
        if (permission.receive !== "granted") {
          const requested = await PushNotifications.requestPermissions();
          if (requested.receive !== "granted") {
            return;
          }
        }

        const registrationListener = await PushNotifications.addListener(
          "registration",
          async (token: Token) => {
            if (!isMounted) return;
            window.localStorage.setItem(TOKEN_STORAGE_KEY, token.value);
            await registerToken(token.value, Capacitor.getPlatform());
          },
        );

        const registrationErrorListener = await PushNotifications.addListener(
          "registrationError",
          (error) => {
            console.error("Push registration error", error);
          },
        );

        const receivedListener = await PushNotifications.addListener(
          "pushNotificationReceived",
          (notification: PushNotificationSchema) => {
            const title = notification.title || "Notification";
            const body =
              notification.body || notification.data?.message || "New alert";
            toast.info(body, {
              toastId: `push-${notification.id || `${Date.now()}`}`,
              onClick: () => {
                const reportId = notification.data?.reportId;
                if (reportId) {
                  router.push(`/dashboard/reports/${reportId}`);
                }
              },
            });
            console.log("Push received", title, notification);
          },
        );

        const actionListener = await PushNotifications.addListener(
          "pushNotificationActionPerformed",
          (notification) => {
            const reportId = notification.notification.data?.reportId;
            if (reportId) {
              router.push(`/dashboard/reports/${reportId}`);
            }
          },
        );

        await PushNotifications.register();

        return () => {
          registrationListener.remove();
          registrationErrorListener.remove();
          receivedListener.remove();
          actionListener.remove();
        };
      } catch (error) {
        console.error("Failed to initialize mobile push notifications", error);
      }
    };

    let cleanup: void | (() => void);

    run().then((result) => {
      cleanup = result;
    });

    return () => {
      isMounted = false;
      cleanup?.();
    };
  }, [enabled, router, userId]);
}
