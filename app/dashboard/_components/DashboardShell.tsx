"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

type SessionUser = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  mobileNumber?: string | null;
  role: string | null;
};

type MenuKey =
  | "dashboard"
  | "users"
  | "roles"
  | "permissions"
  | "reports"
  | "team"
  | "profile"
  | "todo"
  | "projects";

type DashboardContextValue = {
  user: SessionUser | null;
  permissions: string[];
  isAdmin: boolean;
  navOpen: boolean;
  setNavOpen: (open: boolean) => void;
};

const DashboardContext = createContext<DashboardContextValue | null>(null);

let cachedSession: { user: SessionUser | null; permissions: string[] } | null =
  null;

export function clearCachedSession() {
  cachedSession = null;
}

export const useDashboardContext = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboardContext must be used within DashboardShell");
  }
  return context;
};

const routeByMenu: Record<MenuKey, string> = {
  dashboard: "/dashboard",
  users: "/dashboard/users",
  roles: "/dashboard/roles",
  permissions: "/dashboard/permissions",
  reports: "/dashboard/reports",
  team: "/dashboard/team",
  profile: "/dashboard/profile",
  todo: "/dashboard/todo",
  projects: "/dashboard/projects",
};

const getActiveMenu = (pathname: string): MenuKey => {
  if (pathname.startsWith("/dashboard/users")) return "users";
  if (pathname.startsWith("/dashboard/projects")) return "projects";
  if (pathname.startsWith("/dashboard/todo")) return "todo";
  if (pathname.startsWith("/dashboard/roles")) return "roles";
  if (pathname.startsWith("/dashboard/permissions")) return "permissions";
  if (pathname.startsWith("/dashboard/reports")) return "reports";
  if (pathname.startsWith("/dashboard/team")) return "team";
  if (pathname.startsWith("/dashboard/profile")) return "profile";
  return "dashboard";
};

type DashboardShellProps = {
  children: React.ReactNode;
  requireAdmin?: boolean;
};

export default function DashboardShell({
  children,
  requireAdmin = false,
}: DashboardShellProps) {
  const parentContext = useContext(DashboardContext);
  if (parentContext) {
    return <>{children}</>;
  }

  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(!cachedSession);
  const [user, setUser] = useState<SessionUser | null>(
    cachedSession?.user ?? null,
  );
  const [permissions, setPermissions] = useState<string[]>(
    cachedSession?.permissions ?? [],
  );
  const [navOpen, setNavOpen] = useState(false);

  const isAdmin = user?.role === "Admin";
  const displayName = user ? `${user.firstName} ${user.lastName}`.trim() : "";

  useEffect(() => {
    const loadSession = async () => {
      if (cachedSession) {
        setUser(cachedSession.user);
        setPermissions(cachedSession.permissions);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/auth/session");
        if (!res.ok) {
          router.replace("/login");
          return;
        }
        const data = await res.json();
        const userData = data.user;
        const permsData = data.permissions || [];

        cachedSession = { user: userData, permissions: permsData };

        setUser(userData);
        setPermissions(permsData);
      } catch (error) {
        console.error("Failed to load session", error);
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, [router]);

  useEffect(() => {
    if (loading) return;
    if (requireAdmin && !isAdmin) {
      router.replace("/dashboard");
    }
  }, [loading, requireAdmin, isAdmin, router]);

  const menuItems = useMemo(() => {
    const items: { key: MenuKey; label: string }[] = [
      { key: "dashboard", label: "Dashboard" },
    ];

    if (isAdmin) {
      items.push({ key: "users", label: "Users" });
      items.push({ key: "projects", label: "Projects" });
    }
    items.push({ key: "todo", label: "To-Do" });
    items.push({ key: "reports", label: "Reporting" });

    items.push({ key: "profile", label: "My Profile" });
    return items;
  }, [isAdmin]);

  const activeMenu = useMemo(() => getActiveMenu(pathname), [pathname]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      clearCachedSession();
      setUser(null);
      setPermissions([]);
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      router.push("/login");
    }
  };

  if (requireAdmin && !isAdmin && !loading) {
    return null;
  }

  const contextValue: DashboardContextValue = {
    user,
    permissions,
    isAdmin,
    navOpen,
    setNavOpen,
  };

  return (
    <DashboardContext.Provider value={contextValue}>
      <main className="rbac-shell">
        <aside className={`rbac-sidebar ${navOpen ? "open" : ""}`}>
          <div className="rbac-brand">
            {!navOpen && (
              <>
                <Link href="/dashboard">
                  <div className="rbac-logo">
                    <img
                      src="/images/logo.svg"
                      className="w-full"
                      alt="WellMen"
                    />
                  </div>
                </Link>
              </>
            )}
          </div>

          <nav className="rbac-nav">
            {menuItems.map((item) => (
              <Link
                key={item.key}
                href={routeByMenu[item.key]}
                className={`rbac-nav-item ${
                  activeMenu === item.key ? "active" : ""
                }`}
                onClick={() => setNavOpen(false)}
                prefetch={true}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="rbac-profile">
            <p className="rbac-label">Signed in</p>
            <p className="rbac-name">{displayName}</p>
            <p className="rbac-email">{user?.email}</p>
            <button className="rbac-logout" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </aside>

        {navOpen && (
          <button className="rbac-overlay" onClick={() => setNavOpen(false)} />
        )}
        <section className="rbac-main">
          <div className="rbac-mobile-topbar">
            <Link href="/dashboard">
              <div className="rbac-logo">
                <img src="/images/logo.svg" alt="WellMen" />
              </div>
            </Link>
            <button
              className="rbac-hamburger"
              type="button"
              onClick={() => setNavOpen(true)}
            >
              <span />
            </button>
          </div>
          <div className="rbac-container">
            {loading ? (
              <div className="rbac-loading-placeholder">
                <p>Loading dashboard...</p>
              </div>
            ) : (
              children
            )}
          </div>
        </section>
      </main>
    </DashboardContext.Provider>
  );
}
