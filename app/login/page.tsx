"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FaSpinner } from "react-icons/fa";
import { clearCachedSession } from "../dashboard/_components/DashboardShell";
import { useThemeMode } from "../components/ThemeProvider";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ mobileNumber: "", password: "" });
  const [note, setNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null);
  const { theme } = useThemeMode();
  const [setupForm, setSetupForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobileNumber: "",
    password: "",
    confirmPassword: "",
  });
  const [setupNote, setSetupNote] = useState<string | null>(null);
  const [setupLoading, setSetupLoading] = useState(false);

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const res = await fetch("/api/auth/status");
        if (!res.ok) return;
        const data = await res.json();
        if (data.authenticated) {
          router.replace("/dashboard");
          return;
        }

        setNeedsSetup(Boolean(data.needsSetup));
      } catch (error) {
        console.error("Failed to check auth status", error);
      }
    };

    loadStatus();
  }, [router]);

  const isMobileValid = (mobileNumber: string) => /^\d{10}$/.test(mobileNumber);
  const isPasswordValid = (password: string) => /^\d{4}$/.test(password);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setNote(null);
    setLoading(true);

    if (!form.mobileNumber.trim() || !form.password) {
      setNote("Enter your mobile number and password.");
      setLoading(false);
      return;
    }

    if (!isMobileValid(form.mobileNumber.trim())) {
      setNote("Mobile number must be 10 digits and numbers only.");
      setLoading(false);
      return;
    }

    if (!isPasswordValid(form.password)) {
      setNote("Password must be exactly 4 digits.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobileNumber: form.mobileNumber,
          password: form.password,
        }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        setNote(payload.error || "Login failed.");
        setLoading(false);
        return;
      }

      clearCachedSession();
      router.replace("/dashboard");
    } catch (error) {
      console.error("Login failed", error);
      setNote("Login failed. Try again.");
      setLoading(false);
    }
  };

  const handleSetup = async (event: React.FormEvent) => {
    event.preventDefault();
    setSetupNote(null);
    setSetupLoading(true);

    const isEmailValid = (email: string) => /\S+@\S+\.\S+/.test(email);
    const isMobileValid = (mobileNumber: string) =>
      /^\d{10}$/.test(mobileNumber);
    const isPasswordValid = (password: string) => /^\d{4}$/.test(password);

    if (
      !setupForm.firstName.trim() ||
      !setupForm.lastName.trim() ||
      !setupForm.email.trim() ||
      !setupForm.mobileNumber.trim()
    ) {
      setSetupNote(
        "First name, last name, email, and mobile number are required.",
      );
      setSetupLoading(false);
      return;
    }

    if (!isEmailValid(setupForm.email.trim())) {
      setSetupNote("Email must contain @ and .");
      setSetupLoading(false);
      return;
    }

    if (!isMobileValid(setupForm.mobileNumber.trim())) {
      setSetupNote("Mobile number must be 10 digits and numbers only.");
      setSetupLoading(false);
      return;
    }

    if (!isPasswordValid(setupForm.password)) {
      setSetupNote("Password must be exactly 4 digits.");
      setSetupLoading(false);
      return;
    }

    if (setupForm.password !== setupForm.confirmPassword) {
      setSetupNote("Passwords do not match.");
      setSetupLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: setupForm.firstName,
          lastName: setupForm.lastName,
          email: setupForm.email,
          mobileNumber: setupForm.mobileNumber,
          password: setupForm.password,
          roleName: "Admin",
        }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        setSetupNote(payload.error || "Failed to create Admin.");
        setSetupLoading(false);
        return;
      }

      setSetupNote("Admin created. Please log in.");
      setNeedsSetup(false);
      setSetupForm({
        firstName: "",
        lastName: "",
        email: "",
        mobileNumber: "",
        password: "",
        confirmPassword: "",
      });
      setSetupLoading(false);
    } catch (error) {
      console.error("Setup failed", error);
      setSetupNote("Failed to create Admin.");
      setSetupLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-10">
      <div className="">
        {needsSetup ? (
          <section className="theme-modal-surface rounded-3xl p-8 shadow-xl">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold tracking-[0.3em] uppercase text-[color:var(--brand)]">
                First-Time Setup
              </p>
              <span className="text-xs theme-text-muted">Create Admin</span>
            </div>
            <form
              className="mt-6 grid gap-4"
              autoComplete="off"
              onSubmit={handleSetup}
            >
              <label className="text-sm font-semibold theme-text">
                First name
                <input
                  className="theme-input mt-2 w-full rounded-xl px-4 py-3 focus:outline-none"
                  value={setupForm.firstName}
                  onChange={(event) =>
                    setSetupForm((prev) => ({
                      ...prev,
                      firstName: event.target.value,
                    }))
                  }
                  placeholder="First name"
                />
              </label>
              <label className="text-sm font-semibold theme-text">
                Last name
                <input
                  className="theme-input mt-2 w-full rounded-xl px-4 py-3 focus:outline-none"
                  value={setupForm.lastName}
                  onChange={(event) =>
                    setSetupForm((prev) => ({
                      ...prev,
                      lastName: event.target.value,
                    }))
                  }
                  placeholder="Last name"
                />
              </label>
              <label className="text-sm font-semibold theme-text">
                Email
                <input
                  type="email"
                  autoComplete="off"
                  className="theme-input mt-2 w-full rounded-xl px-4 py-3 focus:outline-none"
                  value={setupForm.email}
                  onChange={(event) =>
                    setSetupForm((prev) => ({
                      ...prev,
                      email: event.target.value,
                    }))
                  }
                  placeholder="admin@company.com"
                />
              </label>
              <label className="text-sm font-semibold theme-text">
                Mobile number
                <input
                  inputMode="tel"
                  className="theme-input mt-2 w-full rounded-xl px-4 py-3 focus:outline-none"
                  value={setupForm.mobileNumber}
                  onChange={(event) =>
                    setSetupForm((prev) => ({
                      ...prev,
                      mobileNumber: event.target.value,
                    }))
                  }
                  placeholder="Mobile number"
                />
              </label>
              <label className="text-sm font-semibold theme-text">
                Password
                <input
                  type="password"
                  autoComplete="new-password"
                  className="theme-input mt-2 w-full rounded-xl px-4 py-3 focus:outline-none"
                  value={setupForm.password}
                  onChange={(event) =>
                    setSetupForm((prev) => ({
                      ...prev,
                      password: event.target.value,
                    }))
                  }
                  placeholder="4 digits"
                />
              </label>
              <label className="text-sm font-semibold theme-text">
                Confirm password
                <input
                  type="password"
                  className="theme-input mt-2 w-full rounded-xl px-4 py-3 focus:outline-none"
                  value={setupForm.confirmPassword}
                  onChange={(event) =>
                    setSetupForm((prev) => ({
                      ...prev,
                      confirmPassword: event.target.value,
                    }))
                  }
                  placeholder="Re-enter password"
                />
              </label>
              {setupNote && (
                <p className="rounded-xl  px-4 py-2 text-sm text-red-500">
                  {setupNote}
                </p>
              )}
              <button
                className="mt-2 rounded-full bg-[color:var(--brand)] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[0_12px_24px_rgba(249,115,22,0.25)] transition hover:bg-[color:var(--brand-dark)] flex items-center justify-center disabled:opacity-50"
                type="submit"
                disabled={setupLoading}
              >
                {setupLoading && (
                  <FaSpinner className="animate-spin mr-2" size={14} />
                )}
                Create Admin
              </button>
            </form>
          </section>
        ) : (
          <section className="theme-modal-surface rounded-3xl p-8 shadow-xl">
            <div className="flex justify-center">
              <img
                src={`${theme === "dark" ? "/images/logo_white.png" : "/images/logo.svg"}`}
                alt="WellMen"
              />
            </div>
            <div className="flex items-center justify-between mt-5">
              <p className="text-xs font-semibold tracking-[0.3em] uppercase text-[color:var(--brand)]">
                Sign In
              </p>
            </div>
            <p className="mt-3 text-sm theme-text-muted">
              Use your mobile number and password to continue.
            </p>
            <form className="mt-4 grid gap-4" onSubmit={handleSubmit}>
              <label className="text-sm font-semibold theme-text">
                Mobile number
                <input
                  inputMode="tel"
                  className="theme-input mt-2 w-full rounded-xl px-4 py-3 focus:outline-none"
                  value={form.mobileNumber}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      mobileNumber: event.target.value,
                    }))
                  }
                  placeholder="Enter your mobile number"
                />
              </label>
              <label className="text-sm font-semibold theme-text">
                Password
                <input
                  type="password"
                  className="theme-input mt-2 w-full rounded-xl px-4 py-3 focus:outline-none"
                  value={form.password}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      password: event.target.value,
                    }))
                  }
                  placeholder="Enter your password"
                />
              </label>
              {note && (
                <p className="rounded-xl px-4 text-sm text-red-500">{note}</p>
              )}
              <button
                className="mt-2 rounded-full bg-[color:var(--brand)] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[0_12px_24px_rgba(249,115,22,0.25)] transition hover:bg-[color:var(--brand-dark)] flex items-center justify-center disabled:opacity-50"
                type="submit"
                disabled={loading}
              >
                {loading && (
                  <FaSpinner className="animate-spin mr-2" size={14} />
                )}
                Continue
              </button>
            </form>
          </section>
        )}
      </div>
    </main>
  );
}
