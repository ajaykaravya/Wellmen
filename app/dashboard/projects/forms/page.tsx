"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import DashboardShell from "../../_components/DashboardShell";
import { projectFormApi } from "@/lib/api/dashboard/project-form";
import { ColumnDef, getCoreRowModel } from "@tanstack/table-core";
import { flexRender, useReactTable } from "@tanstack/react-table";
import {
    FaEdit,
    FaSpinner,
} from "react-icons/fa";
import { useRouter } from "next/navigation";

type ProjectFormRow = {
    id: string;
    formId: string;
    name: string;
    status: "PENDING" | "COMPLETED";
    formData: Record<string, any>
};

function ProjectFormList() {
    const searchParams = useSearchParams();

    const [projectForms, setProjectForms] = useState<ProjectFormRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [projectName, setProjectName] = useState("")
    const router = useRouter()
    const projectId = searchParams.get("projectId") || "";

    const loadProject = useCallback(async () => {
        if (!projectId) return;

        try {
            const res = await fetch(`/api/projects/${projectId}`);

            const data = await res.json();

            setProjectName(data.name);

        } catch (error) {
            console.error("Failed to load project", error);
        }

    }, [projectId]);

    useEffect(() => {
        loadProject();
    }, [loadProject]);

    const loadProjectForms = useCallback(async () => {
        setLoading(true);

        try {
            const data = await projectFormApi.list({
                projectId
            });

            setProjectForms(
                Array.isArray(data?.data)
                    ? data.data
                    : []
            );

        } catch (error) {
            console.error("Failed to load project forms", error);
        } finally {
            setLoading(false);
        }

    }, []);

    const handleEdit = useCallback((row: ProjectFormRow) => {
        router.push(`/dashboard/projects/forms/${row.id}`)
    }, [])

    useEffect(() => {
        loadProjectForms();
    }, [loadProjectForms]);

    const columns = useMemo<ColumnDef<ProjectFormRow>[]>(
        () => [
            {
                header: "Name",
                accessorKey: "name",
                cell: (info) => (
                    <span className="rbac-muted">{String(info.getValue() || "")}</span>
                ),
            },
            {
                header: "Status",
                accessorKey: "status",
                cell: (info) => (
                    <span className="rbac-muted">{String(info.getValue() === "PENDING" ? "Pending" : "Completed")}</span>
                ),
            },
            {
                header: "Action",
                id: "action",
                cell: ({ row }) => (
                    <div className="rbac-inline-actions justify-end flex gap-4">
                        <button onClick={() => handleEdit(row.original)} className="rbac-link" type="button">
                            <FaEdit />
                        </button>
                    </div>
                )
            }
        ],
        []
    );

    const table = useReactTable({
        data: projectForms,
        columns,
        getCoreRowModel: getCoreRowModel(),
        manualPagination: true,
    });

    return (
        <section className="rbac-section rbac-container">
            <div className="rbac-card">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="rbac-title-lg">{projectName}</h3>
                </div>
                <div className="mt-4">
                    <div className="hidden md:block overflow-x-auto">
                        <table className="theme-table min-w-full border border-slate-200 border-separate border-spacing-0">
                            <thead className="bg-slate-50">
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <tr key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => (
                                            <th
                                                key={header.id}
                                                style={{ width: header.getSize() }}
                                                className={`text-left text-xs font-semibold uppercase px-4 py-3 border-b border-slate-200 ${header.id === "action" ? "text-right" : "text-left"}`}
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
                                {!loading && projectForms.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={columns.length}
                                            className="px-4 py-3 text-sm text-slate-500"
                                        >
                                            No projects found.
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
                                                    style={{ width: cell.column.getSize() }}
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
                </div>
                <div className="md:hidden space-y-3">
                    {loading && (
                        <div className="flex items-center justify-center py-4">
                            <FaSpinner className="animate-spin mr-2" size={16} />
                        </div>
                    )}
                    {!loading && projectForms.length === 0 && (
                        <div className="rbac-card py-4 text-sm text-slate-500">
                            No project forms found.
                        </div>
                    )}
                    {!loading &&
                        projectForms.map((projectForm) => (
                            <div key={projectForm.id} className="rbac-card p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="text-sm font-semibold">
                                            {projectForm.name}
                                        </h4>
                                        <p className="text-xs text-slate-500">
                                            {projectForm.status === "PENDING" ? "Pending" : "Completed"}
                                        </p>
                                    </div>
                                    <div>
                                        <button className="rbac-link" type="button">
                                            <FaEdit onClick={() => handleEdit(projectForm)} size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))

                    }
                </div>
            </div>
        </section>
    )
}

export default function ProjectFormPage() {
    return (
        <DashboardShell>
            <ProjectFormList />
        </DashboardShell>
    )
};