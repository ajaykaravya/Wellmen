"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { flexRender, useReactTable, ColumnDef, getCoreRowModel } from "@tanstack/react-table";
import DashboardShell, { useDashboardContext } from "../_components/DashboardShell";
import ConfirmDialog from "../../components/ConfirmDialog";
import { toast } from "react-toastify";
import { FaChevronLeft, FaChevronRight, FaEdit, FaTrash, FaSpinner } from "react-icons/fa";
import Link from "next/link";

type UserRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  mobileNumber?: string | null;
  role?: string | null;
};

function UsersContent() {
  const router = useRouter();
  const { isAdmin, setNavOpen, user } = useDashboardContext();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<UserRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const loadUsers = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/users?page=${pageIndex + 1}&pageSize=${pageSize}`
      );
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
  }, [isAdmin, pageIndex, pageSize]);

  const handleEditUser = (row: UserRow) => {
    router.push(`/dashboard/users/${row.id}`);
  };

  const handleDeleteUser = async (row: UserRow) => {
    setConfirmTarget(row);
    setConfirmOpen(true);
  };

  const confirmDeleteUser = async () => {
    if (!confirmTarget) return;
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
      setConfirmOpen(false);
      setConfirmTarget(null);
    }
  };

  const columns = useMemo<ColumnDef<UserRow>[]>(
    () => [
      {
        header: "Name",
        accessorKey: "firstName",
        cell: ({row}:any) => (
          <span className="rbac-muted">
            {row.original?.firstName} {row.original?.lastName}
          </span>
        ),
      },
      {
        header: "Mobile number",
        accessorKey: "mobileNumber",
        cell: (info:any) => (
          <span className="rbac-muted">{(info.getValue() as string) || "-"}</span>
        ),
      },
      {
        header: "Role",
        accessorKey: "role",
        cell: (info:any) => (
          <span className="rbac-muted">{(info.getValue() as string) || "-"}</span>
        ),
      },
      {
        header: "Action",
        id: "action",
        cell: ({ row }:any) => (
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
    [handleEditUser, handleDeleteUser]
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
          <div className="flex justify-between items-center">
          <h3 className="rbac-title-lg">Users List</h3>
          <Link href="/dashboard/users/new">
          <button
          className="rbac-button"
          type="button"
        >
          Create user
        </button>
        </Link>
        </div>
          <div className="mt-4">
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full border border-slate-200 border-separate border-spacing-0">
                <thead className="bg-slate-50">
                  {table.getHeaderGroups().map((headerGroup:any) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header:any) => (
                        <th
                          key={header.id}
                          className="text-left text-xs font-semibold uppercase px-4 py-3 border-b border-slate-200"
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={columns.length} className="px-4 py-3 text-sm text-slate-500">
                        <div className="flex items-center justify-center">
                          <FaSpinner className="animate-spin mr-2" size={16} />
                        </div>
                      </td>
                    </tr>
                  )}
                  {!loading && users.length === 0 && (
                    <tr>
                      <td colSpan={columns.length} className="px-4 py-3 text-sm text-slate-500">
                        No users found.
                      </td>
                    </tr>
                  )}
                  {!loading &&
                    table.getRowModel().rows.map((row:any, index:number) => (
                      <tr key={row.id} className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                        {row.getVisibleCells().map((cell:any) => (
                          <td key={cell.id} className="px-4 py-3 text-sm border-b border-slate-100">
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
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
                <div className="rbac-card py-4 text-sm text-slate-500">No users found.</div>
              )}
              {!loading && users.map((user) => (
                <div key={user.id} className="rbac-card p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold">{user.firstName} {user.lastName}</h4>
                      <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="rbac-link"
                        type="button"
                        onClick={() => handleEditUser(user)}
                      >
                        <FaEdit />
                      </button>
                      <button
                        className="rbac-link danger"
                        type="button"
                        onClick={() => handleDeleteUser(user)}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                  <div className="grid gap-1 text-sm">
                    <p><strong>Mobile:</strong> {user.mobileNumber || "-"}</p>
                    <p><strong>Role:</strong> {user.role || "-"}</p>
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
                <FaChevronLeft size={20}/>
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
                <FaChevronRight size={20}/>
              </button>
              </div>
              <div>
              <select
                className="rbac-input rbac-select"
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
        description={
          confirmTarget
            ? `Delete ${confirmTarget.firstName} ${confirmTarget.lastName}? This action cannot be undone.`
            : "This action cannot be undone."
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={confirmDeleteUser}
        onClose={() => {
          setConfirmOpen(false);
          setConfirmTarget(null);
        }}
      />
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
