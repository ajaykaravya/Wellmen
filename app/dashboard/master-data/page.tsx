import Link from "next/link";
import DashboardShell from "../_components/DashboardShell";

const cards = [
  {
    title: "Project Work Categories",
    description: "Manage the project category master list.",
    href: "/dashboard/project-categories",
  },
  {
    title: "Office Work Categories",
    description: "Manage office category masters.",
    href: "/dashboard/office-categories",
  },
  {
    title: "Service Work Categories",
    description: "Manage service category masters.",
    href: "/dashboard/service-categories",
  },
  {
    title: "Reporting Work Categories",
    description: "Manage reporting category masters.",
    href: "/dashboard/reporting-categories",
  },
  {
    title: "Expense Types",
    description: "Manage daily expense type masters.",
    href: "/dashboard/expense-types",
  },
  {
    title: "Transport",
    description: "Manage transport rate configs and delivery slabs.",
    href: "/dashboard/transport-configs",
  },
];

export default function MasterDataPage() {
  return (
    <DashboardShell>
      <section className="rbac-section rbac-container">
        <div className="rbac-card">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="rbac-title-lg">Master Data</h3>
              <p className="rbac-muted">
                Keep reusable setup values in one place.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {cards.map((card) => (
              <Link
                key={card.href}
                href={card.href}
                className="rounded-2xl border border-[color:var(--theme-border)] bg-[color:var(--theme-surface-2)] p-5 transition hover:border-[color:var(--brand)] hover:shadow-sm"
              >
                <h4 className="text-base font-semibold">{card.title}</h4>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  {card.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </DashboardShell>
  );
}
