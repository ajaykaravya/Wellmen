"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ mobileNumber: "", password: "" });
  const [note, setNote] = useState<string | null>(null);
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null);
  const [setupForm, setSetupForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobileNumber: "",
    password: "",
    confirmPassword: "",
  });
  const [setupNote, setSetupNote] = useState<string | null>(null);

  useEffect(() => {
    const loadBootstrap = async () => {
      try {
        const res = await fetch("/api/auth/bootstrap");
        if (!res.ok) return;
        const data = await res.json();
        setNeedsSetup(Boolean(data.needsSetup));
      } catch (error) {
        console.error("Failed to check bootstrap", error);
      }
    };

    loadBootstrap();
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setNote(null);

    if (!form.mobileNumber.trim() || !form.password) {
      setNote("Enter your mobile number and password.");
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
        return;
      }

      router.push("/dashboard");
    } catch (error) {
      console.error("Login failed", error);
      setNote("Login failed. Try again.");
    }
  };

  const handleSetup = async (event: React.FormEvent) => {
    event.preventDefault();
    setSetupNote(null);

    if (
      !setupForm.firstName.trim() ||
      !setupForm.lastName.trim() ||
      !setupForm.email.trim() ||
      !setupForm.mobileNumber.trim()
    ) {
      setSetupNote("First name, last name, email, and mobile number are required.");
      return;
    }
    if (setupForm.password.length < 6) {
      setSetupNote("Password must be at least 6 characters.");
      return;
    }
    if (setupForm.password !== setupForm.confirmPassword) {
      setSetupNote("Passwords do not match.");
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
    } catch (error) {
      console.error("Setup failed", error);
      setSetupNote("Failed to create Admin.");
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-6xl grid gap-8 lg:grid-cols-[1.15fr_1fr]">
        <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-white to-slate-50 p-9 shadow-lg">
            <p className="text-xs font-semibold tracking-[0.3em] uppercase text-blue-600">
              Secure Access
            </p>
            <h1 className="mt-4 text-4xl font-semibold text-slate-900">
              Welcome back
            </h1>
            <p className="mt-3 text-slate-600">
              Admins and users sign in with mobile number and password.
            </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Admin
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Manage users, roles, and permissions.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Employee
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Access your profile and daily tasks.
              </p>
            </div>
          </div>
        </section>

        {needsSetup ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold tracking-[0.3em] uppercase text-blue-600">
                First-Time Setup
              </p>
              <span className="text-xs text-slate-400">Create Admin</span>
            </div>
            <form className="mt-6 grid gap-4" onSubmit={handleSetup}>
              <label className="text-sm font-semibold text-slate-700">
                First name
                <input
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none"
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
              <label className="text-sm font-semibold text-slate-700">
                Last name
                <input
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none"
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
              <label className="text-sm font-semibold text-slate-700">
                Email
                <input
                  type="email"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none"
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
              <label className="text-sm font-semibold text-slate-700">
                Mobile number
                <input
                  inputMode="tel"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none"
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
              <label className="text-sm font-semibold text-slate-700">
                Password
                <input
                  type="password"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none"
                  value={setupForm.password}
                  onChange={(event) =>
                    setSetupForm((prev) => ({
                      ...prev,
                      password: event.target.value,
                    }))
                  }
                  placeholder="Minimum 6 characters"
                />
              </label>
              <label className="text-sm font-semibold text-slate-700">
                Confirm password
                <input
                  type="password"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none"
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
                <p className="rounded-xl bg-blue-50 px-4 py-2 text-sm text-blue-700">
                  {setupNote}
                </p>
              )}
              <button
                className="mt-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700"
                type="submit"
              >
                Create Admin
              </button>
            </form>
          </section>
        ) : (
          <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold tracking-[0.3em] uppercase text-blue-600">
                Sign In
              </p>
            </div>
            <p className="mt-3 text-sm text-slate-500">
              Use your mobile number and password to continue.
            </p>
            <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
              <label className="text-sm font-semibold text-slate-700">
                Mobile number
                <input
                  inputMode="tel"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none"
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
              <label className="text-sm font-semibold text-slate-700">
                Password
                <input
                  type="password"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none"
                  value={form.password}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, password: event.target.value }))
                  }
                  placeholder="Enter your password"
                />
              </label>
              {note && (
                <p className="rounded-xl bg-blue-50 px-4 py-2 text-sm text-blue-700">
                  {note}
                </p>
              )}
              <button
                className="mt-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700"
                type="submit"
              >
                Continue
              </button>
            </form>
          </section>
        )}
      </div>
    </main>
  );
}
