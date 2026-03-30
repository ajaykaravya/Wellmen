"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
  const [formLoading, setFormLoading] = useState(Boolean(userId));
  const [errors, setErrors] = useState<Partial<Record<keyof UserFormState, string>>>({});
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
      } finally {
        setFormLoading(false);
      }
    };

    loadUser();
  }, [userId]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const newErrors: Partial<Record<keyof UserFormState, string>> = {};
    if (!form.firstName.trim()) newErrors.firstName = "First name is required.";
    if (!form.lastName.trim()) newErrors.lastName = "Last name is required.";
    if (!form.email.trim()) newErrors.email = "Email is required.";
    if (!form.mobileNumber.trim()) newErrors.mobileNumber = "Mobile number is required.";
    if (!userId && !form.password) newErrors.password = "Password is required.";
    if (!form.roleName?.trim()) newErrors.roleName = "Role name is required.";

    setErrors(newErrors);
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
        return;
      }

      router.push("/dashboard/users");
    } catch (error) {
      console.error("Failed to save user", error);
    }
  };

  if (formLoading) return null;

  return (
    <>
      <section className="rbac-section">
        <div className="rbac-card">
          <form className="rbac-form" onSubmit={handleSubmit}>
            <div className="">
              <label className="rbac-label">
                First name <span className="text-red-600">*</span>
                <input
                  className="rbac-input mb-2"
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
              {errors.firstName && (
                <p className="text-sm text-red-600 mb-2">{errors.firstName}</p>
              )}
              <label className="rbac-label mt-5">
                Last name <span className="text-red-600">*</span>
                <input
                  className="rbac-input mb-2"
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
              {errors.lastName && (
                <p className="text-sm text-red-600 mt-1">{errors.lastName}</p>
              )}
              <label className="rbac-label">
                Email <span className="text-red-600">*</span>
                <input
                  className="rbac-input mb-2"
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
              {errors.email && (
                <p className="text-sm text-red-600 mb-2">{errors.email}</p>
              )}
              <label className="rbac-label">
                Mobile number <span className="text-red-600">*</span>
                <input
                  inputMode="tel"
                  className="rbac-input mb-2"
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
              {errors.mobileNumber && (
                <p className="text-sm text-red-600 mb-2">{errors.mobileNumber}</p>
              )}
              <label className="rbac-label mt-5">
                Password {userId ? "(optional)" : "*"}
                <input
                  type="password"
                  className="rbac-input mb-2"
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
              {errors.password && (
                <p className="text-sm text-red-600 mb-2">{errors.password}</p>
              )}
              <label className="rbac-label mt-5">
                Role <span className="text-red-600">*</span>
                <select
                  className="rbac-input rbac-select"
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
              </label>
              {errors.roleName && (
                <p className="text-sm text-red-600 mb-2">{errors.roleName}</p>
              )}
            </div>
            <div className="rbac-actions">
              <button className="rbac-button" type="submit">
                Save
              </button>
              <Link href="/dashboard/users">
              <button className="text-red-500">
                Cancel
              </button>
              </Link>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}
