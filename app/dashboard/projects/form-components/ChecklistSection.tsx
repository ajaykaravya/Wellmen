"use client";

export default function ChecklistSection({
    section
}: {
    section: any
}) {
    return (
        <div className="rbac-card">
            <h3 className="rbac-title-lg mb-4">
                {section.title}
            </h3>
            <table className="w-full border">
                <thead>
                    <tr>
                        <th>
                            Description
                        </th>
                        <th>
                            Status
                        </th>
                        <th>
                            Remark
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {
                        section.rows.map((row: any) => (
                            <tr key={row.key}>
                                <td>
                                    {row.label}
                                </td>
                                <td>
                                    <select
                                        className="rbac-input"
                                        name={row.key}
                                    >
                                        <option value="">
                                            Select
                                        </option>

                                        <option value="OK">
                                            OK
                                        </option>

                                        <option value="NOT_OK">
                                            NOT OK
                                        </option>

                                    </select>

                                </td>

                                <td>
                                    <input
                                        className="rbac-input"
                                        name={`${row.key}_remark`}
                                    />
                                </td>
                            </tr>
                        ))
                    }

                </tbody>
            </table>
        </div>
    )
}