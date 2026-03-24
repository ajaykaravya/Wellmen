"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDashboardContext } from "../../_components/DashboardShell";

type UserFormState = {
  firstName: string;
  lastName: string;
  email: string;
  mobileNumber: string;
  password: string;
  roleName: string;
};

type UserFormContentProps = {
  userId?: string;
};

export default function UserFormContent({ userId }: UserFormContentProps) {
  const router = useRouter();
  const { setNavOpen } = useDashboardContext();
  const [formLoading, setFormLoading] = useState(Boolean(userId));
  const [note, setNote] = useState<string | null>(null);
  const [form, setForm] = useState<UserFormState>({
    firstName: "",
    lastName: "",
    email: "",
    mobileNumber: "",
    password: "",
    roleName: "Employee",
  });

  useEffect(() => {
    if (!userId) {
      setFormLoading(false);
      return;
    }

    const loadUser = async () => {
      try {
        const res = await fetch(`/api/users/${userId}`);
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          setNote(payload.error || "Failed to load user.");
          setFormLoading(false);
          return;
        }
        const data = await res.json();
        setForm((prev) => ({
          ...prev,
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          email: data.email || "",
          mobileNumber: data.mobileNumber || "",
          roleName: data.role || "Employee",
          password: "",
        }));
      } catch (error) {
        console.error("Failed to load user", error);
        setNote("Failed to load user.");
      } finally {
        setFormLoading(false);
      }
    };

    loadUser();
  }, [userId]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setNote(null);

    if (!form.firstName || !form.lastName || !form.email || !form.mobileNumber) {
      setNote("First name, last name, email, and mobile number are required.");
      return;
    }

    if (!userId && !form.password) {
      setNote("Password is required.");
      return;
    }

    try {
      const endpoint = userId ? `/api/users/${userId}` : "/api/users";
      const method = userId ? "PUT" : "POST";
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        setNote(payload.error || "Failed to save user.");
        return;
      }

      router.push("/dashboard/users");
    } catch (error) {
      console.error("Failed to save user", error);
      setNote("Failed to save user.");
    }
  };

  if (formLoading) return null;

  return (
    <>
      <header className="rbac-header">
        <div>
          <button
            className="rbac-hamburger"
            type="button"
            onClick={() => setNavOpen(true)}
          >
            <span />
          </button>
          <p className="rbac-eyebrow">User Management</p>
          <h1 className="rbac-heading">{userId ? "Edit user" : "Create user"}</h1>
          <p className="rbac-subtext">
            {userId
              ? "Update user details and permissions."
              : "Add a new user and assign their role."}
          </p>
        </div>
        <button
          className="rbac-button rbac-button-secondary"
          type="button"
          onClick={() => router.push("/dashboard/users")}
        >
          Back to users
        </button>
      </header>

      <section className="rbac-section">
        <div className="rbac-card">
          <form className="rbac-form" onSubmit={handleSubmit}>
            <div className="">
              <label className="rbac-label">
                First name
                <input
                  className="rbac-input"
                  placeholder="First name"
                  value={form.firstName}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      firstName: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="rbac-label mt-5">
                Last name
                <input
                  className="rbac-input"
                  placeholder="Last name"
                  value={form.lastName}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      lastName: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="rbac-label mt-5">
                Email
                <input
                  className="rbac-input"
                  placeholder="Email"
                  value={form.email}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      email: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="rbac-label mt-5">
                Mobile number
                <input
                  inputMode="tel"
                  className="rbac-input"
                  placeholder="Mobile number"
                  value={form.mobileNumber}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      mobileNumber: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="rbac-label mt-5">
                Password
                <input
                  type="password"
                  className="rbac-input"
                  placeholder={userId ? "New password (optional)" : "Password"}
                  value={form.password}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      password: event.target.value,
                    }))
                  }
                />
              </label>
              <select
                className="rbac-input rbac-select mt-5"
                value={form.roleName}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    roleName: event.target.value,
                  }))
                }
              >
                <option value="Admin">Admin</option>
                <option value="HR Admin">HR Admin</option>
                <option value="Manager">Manager</option>
                <option value="Employee">Employee</option>
              </select>
            </div>
            {note && <p className="rbac-note">{note}</p>}
            <div className="rbac-actions">
              <button className="rbac-button" type="submit">
                {userId ? "Save changes" : "Save user"}
              </button>
              <button className="text-red-500" type="submit"
                onClick={() => router.push("/dashboard/users")}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}
