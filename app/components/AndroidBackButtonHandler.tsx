"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { App as CapacitorApp } from "@capacitor/app";

const EXIT_DELAY_MS = 2000;
const ROOT_PATHS = ["/", "/dashboard"];

export default function AndroidBackButtonHandler() {
  const router = useRouter();
  const pathname = usePathname();
  const lastBackPress = useRef(0);

  useEffect(() => {
    let backHandler: any;

    const setupListener = async () => {
      backHandler = await CapacitorApp.addListener("backButton", () => {
        const now = Date.now();
        const isRootRoute = ROOT_PATHS.includes(pathname);

        if (!isRootRoute) {
          router.back();
          return;
        }

        if (now - lastBackPress.current < EXIT_DELAY_MS) {
          CapacitorApp.exitApp();
          return;
        }

        lastBackPress.current = now;
      });
    };

    setupListener();

    return () => {
      if (backHandler) {
        backHandler.remove();
      }
    };
  }, [pathname, router]);

  return null;
}