"use client";

import { useEffect, useState } from "react";
import { FaSpinner } from "react-icons/fa";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Loading from "../../../components/Loading";
import { toast } from "react-toastify";

type UserFormState = {
  firstName: string;
  lastName: string;
  email: string;
  mobileNumber: string;
  password: string;
  roleName: string;
};

type Role = {
  id: string;
  name: string;
};

type UserFormContentProps = {
  userId?: string;
};

export default function UserFormContent({ userId }: UserFormContentProps) {
  const router = useRouter();
  const [formLoading, setFormLoading] = useState(Boolean(userId));
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [errors, setErrors] = useState<
    Partial<Record<keyof UserFormState, string>>
  >({});
  const [form, setForm] = useState<UserFormState>({
    firstName: "",
    lastName: "",
    email: "",
    mobileNumber: "",
    password: "",
    roleName: "",
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

  useEffect(() => {
    const loadRoles = async () => {
      try {
        const res = await fetch("/api/roles");
        if (!res.ok) throw new Error("Failed to fetch roles");

        const data = await res.json();
        setRoles(data);
      } catch (error) {
        console.error("Failed to load roles", error);
        toast.error("Failed to load roles");
      } finally {
        setRolesLoading(false);
      }
    };

    loadRoles();
  }, []);

  const isEmailValid = (email: string) => /\S+@\S+\.\S+/.test(email);
  const isPasswordValid = (password: string) => /^\d{4}$/.test(password);
  const isMobileValid = (mobile: string) => /^\d{10}$/.test(mobile);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const newErrors: Partial<Record<keyof UserFormState, string>> = {};
    if (!form.firstName.trim()) newErrors.firstName = "First name is required.";
    if (!form.lastName.trim()) newErrors.lastName = "Last name is required.";

    if (form.email.trim() && !isEmailValid(form.email.trim())) {
      newErrors.email = "Email must contain @ and .";
    }

    if (!form.mobileNumber.trim()) {
      newErrors.mobileNumber = "Mobile number is required.";
    } else if (!isMobileValid(form.mobileNumber.trim())) {
      newErrors.mobileNumber =
        "Mobile number must be 10 digits and numbers only.";
    }

    if (!userId && !form.password) {
      newErrors.password = "Password is required.";
    } else if (form.password) {
      if (!isPasswordValid(form.password)) {
        newErrors.password = "Password must be exactly 4 digits.";
      }
    }

    if (!form.roleName?.trim()) newErrors.roleName = "Role name is required.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    try {
      setSaving(true);
      const endpoint = userId ? `/api/users/${userId}` : "/api/users";
      const method = userId ? "PUT" : "POST";
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        const errorMessage = payload.error || "Failed to save user";
        setNote(errorMessage);
        toast.error(errorMessage);
        return;
      }

      toast.success(
        userId ? "User updated successfully" : "User added successfully",
      );
      router.push("/dashboard/users");
    } catch (error: any) {
      toast.error(error || "Failed to save user");
    } finally {
      setSaving(false);
    }
  };

  if (formLoading)
    return (
      <div className="min-h-80 flex items-center justify-center">
        <Loading />
      </div>
    );

  return (
    <>
      <section className="rbac-section rbac-container">
        <div className="rbac-card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="rbac-title-lg">
              {userId ? "Edit User" : "Add New User"}
            </h3>
          </div>
          <form
            className="rbac-form"
            autoComplete="off"
            onSubmit={handleSubmit}
          >
            <fieldset
              disabled={saving}
              className={saving ? "opacity-70 pointer-events-none" : ""}
            >
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
                  <p className="text-sm text-red-600 mb-2">
                    {errors.firstName}
                  </p>
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
                  Email
                  <input
                    className="rbac-input mb-2"
                    name="user-email"
                    autoComplete="off"
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
                    maxLength={10}
                    onChange={(event) => {
                      const onlyNumbers = event.target.value.replace(/\D/g, "");

                      setForm((prev) => ({
                        ...prev,
                        mobileNumber: onlyNumbers,
                      }));
                    }}
                  />
                </label>
                {errors.mobileNumber && (
                  <p className="text-sm text-red-600 mb-2">
                    {errors.mobileNumber}
                  </p>
                )}
                <label className="rbac-label mt-5">
                  Password{" "}
                  {userId ? "" : <span className="text-red-600">*</span>}
                  <input
                    type="password"
                    className="rbac-input mb-2"
                    name="user-password"
                    autoComplete="new-password"
                    placeholder={
                      userId ? "New password (optional)" : "Password"
                    }
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
                    <option value="">Select Role</option>

                    {rolesLoading ? (
                      <option disabled>Loading roles...</option>
                    ) : roles.length === 0 ? (
                      <option disabled>No roles found</option>
                    ) : (
                      roles.map((role) => (
                        <option key={role.id} value={role.name}>
                          {role.name}
                        </option>
                      ))
                    )}
                  </select>
                </label>
                {errors.roleName && (
                  <p className="text-sm text-red-600 mb-2">{errors.roleName}</p>
                )}
              </div>
            </fieldset>
            <div className="rbac-actions">
              <button className="rbac-button" type="submit" disabled={saving}>
                {saving ? (
                  <span className="inline-flex items-center gap-2">
                    <FaSpinner className="animate-spin" size={16} />
                    Saving...
                  </span>
                ) : (
                  "Save"
                )}
              </button>
              <Link href="/dashboard/users">
                <button
                  className="text-red-500"
                  type="button"
                  disabled={saving}
                >
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
