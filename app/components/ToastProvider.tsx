"use client";

import { ToastContainer } from "react-toastify";
import { useThemeMode } from "./ThemeProvider";
// @ts-ignore
import "react-toastify/dist/ReactToastify.css";

export default function ToastProvider() {
  const { theme } = useThemeMode();

  return (
    <ToastContainer
      position="top-right"
      autoClose={3000}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      pauseOnHover
      draggable
      theme={theme}
    />
  );
}
