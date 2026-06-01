"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  flexRender,
  useReactTable,
  ColumnDef,
  getCoreRowModel,
} from "@tanstack/react-table";
import DashboardShell, {
  useDashboardContext,
} from "../_components/DashboardShell";
import AppliedFilterSummary from "../../components/AppliedFilterSummary";
import ConfirmDialog from "../../components/ConfirmDialog";
import ListingFilterDialog from "../../components/ListingFilterDialog";
import { toast } from "react-toastify";
import {
  FaChevronLeft,
  FaChevronRight,
  FaEdit,
  FaTrash,
  FaSpinner,
  FaFilter
} from "react-icons/fa";
import { FaMobileRetro } from "react-icons/fa6";
import { MdEmail } from "react-icons/md";
import Link from "next/link";
import useDebounce from "@/app/hooks/useDebounce";
import { Listbox } from "@headlessui/react";
import { FaCheck, FaChevronDown } from "react-icons/fa";

type UserRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  mobileNumber?: string | null;
  role?: string | null;
};

type Role = {
  id: string;
  name: string;
};

function UsersContent() {
  const router = useRouter();
  const { isAdmin, setNavOpen, user } = useDashboardContext();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [roleFilter, setRoleFilter] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [draftQuery, setDraftQuery] = useState("");
  const [draftRoleFilter, setDraftRoleFilter] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<UserRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 400);

  const openFilters = () => {
    setDraftQuery(query);
    setDraftRoleFilter(roleFilter);
    setFilterOpen(true);
  };

  const closeFilters = () => {
    setFilterOpen(false);
  };

  const applyFilters = () => {
    setPageIndex(0);
    setQuery(draftQuery);
    setRoleFilter(draftRoleFilter);
    setFilterOpen(false);
  };

  const appliedFilters = [query.trim(), roleFilter].filter(Boolean);

  const loadUsers = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pageIndex + 1),
        pageSize: String(pageSize),
      });

      if (debouncedQuery.trim()) params.set("q", debouncedQuery.trim());
      if (roleFilter) params.set("role", roleFilter);

      const res = await fetch(`/api/users?${params.toString()}`);
      if (!res.ok) return;
      const data = await res.json();
      setUsers(Array.isArray(data?.data) ? data.data : []);
      setTotal(typeof data?.total === "number" ? data.total : 0);
    } catch (error) {
      console.error("Failed to load users", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [isAdmin, pageIndex, pageSize, debouncedQuery, roleFilter]);

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
      }
    };

    loadRoles();
  }, []);

  const handleEditUser = (row: UserRow) => {
    router.push(`/dashboard/users/${row.id}`);
  };

  const handleDeleteUser = async (row: UserRow) => {
    setConfirmTarget(row);
    setConfirmOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!confirmTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/users/${confirmTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        toast.error(payload.error || "Failed to delete user.");
        return;
      }
      await loadUsers();
      toast.success("User deleted successfully.");
    } catch (error) {
      console.error("Failed to delete user", error);
      toast.error("Failed to delete user.");
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
      setConfirmTarget(null);
    }
  };

  const columns = useMemo<ColumnDef<UserRow>[]>(
    () => [
      {
        header: "Name",
        accessorKey: "firstName",
        cell: ({ row }) => (
          <span className="rbac-muted">
            {row.original.firstName} {row.original.lastName}
          </span>
        ),
      },
      {
        header: "Mobile number",
        accessorKey: "mobileNumber",
        cell: (info) => (
          <span className="rbac-muted">
            {(info.getValue() as string) || "-"}
          </span>
        ),
      },
      {
        header: "Email",
        accessorKey: "email",
        cell: (info) => (
          <span className="rbac-muted">
            {(info.getValue() as string) || "-"}
          </span>
        ),
      },
      {
        header: "Role",
        accessorKey: "role",
        cell: (info) => (
          <span className="rbac-muted">
            {(info.getValue() as string) || "-"}
          </span>
        ),
      },
      {
        header: "Action",
        id: "action",
        cell: ({ row }) => (
          <div className="rbac-inline-actions flex gap-4">
            {row.original.id !== user?.id && (
              <>
                <button
                  className="rbac-link"
                  type="button"
                  onClick={() => handleEditUser(row.original)}
                >
                  <FaEdit />
                </button>
                <button
                  className="rbac-link danger"
                  type="button"
                  onClick={() => handleDeleteUser(row.original)}
                >
                  <FaTrash />
                </button>
              </>
            )}
          </div>
        ),
      },
    ],
    [handleEditUser, handleDeleteUser],
  );

  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount,
  });

  return (
    <>
      <section className="rbac-section rbac-container">
        <div className="rbac-card">
          <div className="flex items-center justify-between gap-3">
            <h3 className="rbac-title-lg">Users List</h3>
            <div className="flex
             gap-2">
              <button
                className="rbac-button rbac-button-secondary theme-button-secondary inline-flex items-center gap-2"
                type="button"
                onClick={openFilters}
              >
                <FaFilter />
                <span>Filters</span>
              </button>
              <Link href="/dashboard/users/new">
                <button className="rbac-button" type="button">
                  Add User
                </button>
              </Link>
            </div>
          </div>
          <AppliedFilterSummary
            items={appliedFilters}
            onClear={() => {
              setPageIndex(0);
              setQuery("");
              setRoleFilter("");
              setFilterOpen(false);
            }}
          />
          <div className="mt-4">
            <div className="hidden md:block overflow-x-auto">
              <table className="theme-table min-w-full border border-slate-200 border-separate border-spacing-0">
                <thead className="bg-slate-50">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="text-left text-xs font-semibold uppercase px-4 py-3 border-b border-slate-200"
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td
                        colSpan={columns.length}
                        className="px-4 py-3 text-sm text-slate-500"
                      >
                        <div className="flex items-center justify-center">
                          <FaSpinner className="animate-spin mr-2" size={16} />
                        </div>
                      </td>
                    </tr>
                  )}
                  {!loading && users.length === 0 && (
                    <tr>
                      <td
                        colSpan={columns.length}
                        className="px-4 py-3 text-sm text-slate-500"
                      >
                        No users found.
                      </td>
                    </tr>
                  )}
                  {!loading &&
                    table.getRowModel().rows.map((row, index) => (
                      <tr
                        key={row.id}
                        className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td
                            key={cell.id}
                            className="px-4 py-3 text-sm border-b border-slate-100"
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden space-y-3">
              {loading && (
                <div className="flex items-center justify-center py-4">
                  <FaSpinner className="animate-spin mr-2" size={16} />
                </div>
              )}
              {!loading && users.length === 0 && (
                <div className="rbac-card py-4 text-sm text-slate-500">
                  No users found.
                </div>
              )}
              {!loading &&
                users.map((user) => (
                  <div key={user.id} className="rbac-card p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold">
                          {user.firstName} {user.lastName}
                        </h4>

                      </div>
                      <div className="flex">
                        <button
                          className="rbac-link"
                          type="button"
                          onClick={() => handleEditUser(user)}
                        >
                          <FaEdit size={18} />
                        </button>
                        <button
                          style={{ padding: "2px" }}
                          className="rbac-link danger"
                          type="button"
                          onClick={() => handleDeleteUser(user)}
                        >
                          <FaTrash size={18} />
                        </button>
                      </div>
                    </div>
                    <div className="grid gap-1 text-sm">
                      {
                        user.mobileNumber && (
                          <p className="flex items-center gap-1">
                            <FaMobileRetro /> {user.mobileNumber}
                          </p>
                        )
                      }
                      {user.email && (
                        <p className="flex items-center gap-1">
                          <MdEmail /> {user.email}
                        </p>
                      )}
                      {user.role && (
                        <p>
                          <strong>Role:</strong> {user.role || "-"}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-end gap-3 text-sm">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <button
                  className="change-button change-button-secondary"
                  type="button"
                  onClick={() => setPageIndex((prev) => Math.max(prev - 1, 0))}
                  disabled={pageIndex === 0}
                >
                  <FaChevronLeft size={20} />
                </button>
                <span>
                  Page {pageIndex + 1} of {pageCount}
                </span>
                <button
                  className="change-button change-button-secondary"
                  type="button"
                  onClick={() =>
                    setPageIndex((prev) => Math.min(prev + 1, pageCount - 1))
                  }
                  disabled={pageIndex + 1 >= pageCount}
                >
                  <FaChevronRight size={20} />
                </button>
              </div>
              <div>
                <select
                  className="rbac-input rbac-select rbac-pagination"
                  value={pageSize}
                  onChange={(event) => {
                    setPageIndex(0);
                    setPageSize(Number(event.target.value));
                  }}
                >
                  {[5, 10, 20, 30].map((size) => (
                    <option key={size} value={size}>
                      Show {size}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </section>
      <ConfirmDialog
        open={confirmOpen}
        title="Delete user?"
        description="Are you sure you want to delete?"
        confirmLabel="Delete"
        confirmLoading={deleting}
        confirmLoadingLabel="Deleting..."
        cancelLabel="Cancel"
        onConfirm={confirmDeleteUser}
        onClose={() => {
          setConfirmOpen(false);
          setConfirmTarget(null);
        }}
      />
      <ListingFilterDialog
        open={filterOpen}
        title="User Filters"
        description="Update the filters and apply them when you're ready."
        onClose={closeFilters}
        onApply={applyFilters}
      >
        <input
          className="rbac-input-filter"
          type="text"
          placeholder="Search name or mobile number..."
          value={draftQuery}
          onChange={(event) => setDraftQuery(event.target.value)}
        />
        <Listbox value={draftRoleFilter} onChange={setDraftRoleFilter}>
          <div className="relative">
            <Listbox.Button className="rbac-input-filter flex w-full items-center justify-between text-left">
              <span>
                {draftRoleFilter || "Select Role"}
              </span>

              <FaChevronDown className="text-xs text-slate-500" />
            </Listbox.Button>

            <Listbox.Options className="theme-surface absolute z-50 mt-2 max-h-60 w-full overflow-auto rounded-md py-1 shadow-lg focus:outline-none">
              <Listbox.Option
                value=""
                className={({ active }) =>
                  `cursor-pointer px-4 py-2 text-sm ${active ? "rbac-option-active" : ""
                  }`
                }
              >
                {({ selected }) => (
                  <div className="flex items-center justify-between">
                    <span>Select Role</span>
                  </div>
                )}
              </Listbox.Option>

              {roles.map((role) => (
                <Listbox.Option
                  key={role.id}
                  value={role.name}
                  className={({ active }) =>
                    `cursor-pointer px-4 py-2 text-sm ${active ? "" : ""
                    }`
                  }
                >
                  {({ selected }) => (
                    <div className="flex items-center justify-between">
                      <span>{role.name}</span>
                    </div>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </div>
        </Listbox>
      </ListingFilterDialog>
    </>
  );
}

export default function UsersPage() {
  return (
    <DashboardShell requireAdmin>
      <UsersContent />
    </DashboardShell>
  );
}
