"use client";


export default function ContactSection({
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
                            Department
                        </th>
                        <th>
                            Name
                        </th>
                        <th>
                            Mobile
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

                                    <input
                                        className="rbac-input"
                                        name={`${row.key}_name`}
                                    />

                                </td>
                                <td>

                                    <input
                                        className="rbac-input"
                                        name={`${row.key}_mobile`}
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