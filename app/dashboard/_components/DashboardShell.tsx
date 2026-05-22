"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import ConfirmDialog from "../../components/ConfirmDialog";
import Loading from "../../components/Loading";
import { FaChevronRight, FaMoon, FaSun } from "react-icons/fa";
import { useThemeMode } from "../../components/ThemeProvider";
import { useNotifications } from "@/hooks/useNotifications";
import {
  deactivateCurrentPushToken,
  useMobilePushNotifications,
} from "@/hooks/useMobilePushNotifications";

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
  | "task-management"
  | "transport-management"
  | "query-management"
  | "my-query-management"
  | "projects"
  | "hospitals"
  | "masterData"
  | "transportConfigs"
  | "projectcategories"
  | "officeCategories"
  | "serviceCategories"
  | "reportingCategories"
  | "expenseTypes"
  | "dailyExpenses";

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
  "task-management": "/dashboard/task-management",
  "transport-management": "/dashboard/transport-management",
  "query-management": "/dashboard/query-management",
  "my-query-management": "/dashboard/my-query-management",
  projects: "/dashboard/projects",
  hospitals: "/dashboard/hospitals",
  masterData: "/dashboard/master-data",
  transportConfigs: "/dashboard/transport-configs",
  projectcategories: "/dashboard/project-categories",
  officeCategories: "/dashboard/office-categories",
  serviceCategories: "/dashboard/service-categories",
  reportingCategories: "/dashboard/reporting-categories",
  expenseTypes: "/dashboard/expense-types",
  dailyExpenses: "/dashboard/daily-expenses",
};

const getActiveMenu = (pathname: string): MenuKey => {
  if (pathname.startsWith("/dashboard/users")) return "users";
  if (pathname.startsWith("/dashboard/office-categories"))
    return "officeCategories";
  if (pathname.startsWith("/dashboard/project-categories"))
    return "projectcategories";
  if (pathname.startsWith("/dashboard/service-categories"))
    return "serviceCategories";
  if (pathname.startsWith("/dashboard/reporting-categories"))
    return "reportingCategories";
  if (pathname.startsWith("/dashboard/projects")) return "projects";
  if (pathname.startsWith("/dashboard/hospitals")) return "hospitals";
  if (pathname.startsWith("/dashboard/transport-configs"))
    return "transportConfigs";
  if (pathname.startsWith("/dashboard/master-data")) return "masterData";
  if (pathname.startsWith("/dashboard/task-management"))
    return "task-management";
  if (pathname.startsWith("/dashboard/transport-management"))
    return "transport-management";
  if (pathname.startsWith("/dashboard/query-management"))
    return "query-management";
  if (pathname.startsWith("/dashboard/my-query-management"))
    return "my-query-management";
  if (pathname.startsWith("/dashboard/roles")) return "roles";
  if (pathname.startsWith("/dashboard/permissions")) return "permissions";
  if (pathname.startsWith("/dashboard/reports")) return "reports";
  if (pathname.startsWith("/dashboard/expense-types")) return "expenseTypes";
  if (pathname.startsWith("/dashboard/daily-expenses")) return "dailyExpenses";
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
  const isNestedShell = Boolean(parentContext);

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
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [masterDataExpanded, setMasterDataExpanded] = useState(false);
  const { theme, toggleTheme } = useThemeMode();

  const isAdmin = user?.role === "Admin" || user?.role === "Manager";
  useNotifications(isAdmin ? user?.id || "" : "");
  useMobilePushNotifications(isAdmin, user?.id || "");

  const activeMenu = useMemo(() => getActiveMenu(pathname), [pathname]);

  const isMasterDataActive = useMemo(() => {
    return [
      "projectcategories",
      "officeCategories",
      "serviceCategories",
      "reportingCategories",
      "expenseTypes",
      "masterData",
      "transportConfigs",
    ].includes(activeMenu);
  }, [activeMenu]);

  useEffect(() => {
    if (isNestedShell) return;

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
  }, [isNestedShell, router]);

  useEffect(() => {
    if (isNestedShell) return;
    if (loading) return;
    if (requireAdmin && !isAdmin) {
      router.replace("/dashboard");
    }
  }, [isNestedShell, loading, requireAdmin, isAdmin, router]);

  useEffect(() => {
    if (isNestedShell) return;
    // Auto-expand Master Data section when on any master data page
    if (isMasterDataActive && !masterDataExpanded) {
      setMasterDataExpanded(true);
    }
  }, [isNestedShell, isMasterDataActive, masterDataExpanded]);

  const menuItems = useMemo(() => {
    const items: {
      key: MenuKey;
      label: string;
      hasDropdown?: boolean;
      dropdownItems?: { key: MenuKey; label: string }[];
    }[] = [{ key: "dashboard", label: "Dashboard" }];

    if (isAdmin) {
      items.push({ key: "users", label: "Users" });
      items.push({ key: "projects", label: "Projects" });
      items.push({ key: "hospitals", label: "Hospitals" });
      items.push({
        key: "masterData",
        label: "Master Data",
        hasDropdown: true,
        dropdownItems: [
          { key: "projectcategories", label: "Project work Categories" },
          { key: "officeCategories", label: "Office work Categories" },
          { key: "serviceCategories", label: "Service work Categories" },
          { key: "reportingCategories", label: "Reporting work Categories" },
          { key: "expenseTypes", label: "Expense Types" },
          { key: "transportConfigs", label: "Transport" },
        ],
      });
      items.push({ key: "dailyExpenses", label: "Daily Expense" });
      items.push({ key: "transport-management", label: "Transport Management" });
    }
    items.push({ key: "task-management", label: "Task Management" });
    items.push(
      isAdmin
        ? { key: "query-management", label: "Query Management" }
        : { key: "my-query-management", label: "My Query Management" },
    );
    items.push({ key: "reports", label: "Reporting" });
    items.push({ key: "profile", label: "My Profile" });
    return items;
  }, [isAdmin]);

  if (isNestedShell) {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      await deactivateCurrentPushToken();
      await fetch("/api/auth/logout", { method: "POST" });
      clearCachedSession();
      setUser(null);
      setPermissions([]);
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      setLogoutLoading(false);
      setConfirmLogoutOpen(false);
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
                      src={`${theme === "dark"
                          ? "/images/logo_white.png"
                          : "/images/logo.svg"
                        }`}
                      className="w-full"
                      alt="WellMen"
                    />
                  </div>
                </Link>
              </>
            )}
          </div>

          <div className="rbac-nav-scroll">
            <nav className="rbac-nav">
              {menuItems.map((item) => {
                if (item.hasDropdown && item.dropdownItems) {
                  return (
                    <div key={item.key}>
                      <button
                        className={`rbac-nav-item w-full text-left flex items-center justify-between ${isMasterDataActive ? "active" : ""
                          }`}
                        onClick={() =>
                          setMasterDataExpanded(!masterDataExpanded)
                        }
                      >
                        {item.label}
                        <span
                          className={`ml-2 transition-transform ${masterDataExpanded ? "rotate-90" : ""
                            }`}
                        >
                          <FaChevronRight size={20} />
                        </span>
                      </button>
                      {masterDataExpanded && (
                        <div className="ml-4 space-y-1 mt-1">
                          {item.dropdownItems.map((dropdownItem) => (
                            <Link
                              key={dropdownItem.key}
                              href={routeByMenu[dropdownItem.key]}
                              className={`rbac-nav-item block text-sm ${activeMenu === dropdownItem.key ? "active" : ""
                                }`}
                              onClick={() => setNavOpen(false)}
                              prefetch={true}
                            >
                              {dropdownItem.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.key}
                    href={routeByMenu[item.key]}
                    className={`rbac-nav-item ${activeMenu === item.key ? "active" : ""
                      }`}
                    onClick={() => setNavOpen(false)}
                    prefetch={true}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <button
            className="rbac-logout"
            onClick={() => setConfirmLogoutOpen(true)}
          >
            Logout
          </button>
        </aside>
        <ConfirmDialog
          open={confirmLogoutOpen}
          title="Confirm logout"
          description="Are you sure you want to logout?"
          confirmLabel="Yes"
          confirmLoading={logoutLoading}
          confirmLoadingLabel="Logging out..."
          cancelLabel="No"
          onConfirm={handleLogout}
          onClose={() => setConfirmLogoutOpen(false)}
        />

        {navOpen && (
          <button className="rbac-overlay" onClick={() => setNavOpen(false)} />
        )}
        <section className="rbac-main">
          <div className="rbac-mobile-topbar">
            <Link href="/dashboard">
              <div className="rbac-logo">
                <img
                  src={`${theme === "dark"
                      ? "/images/logo_white.png"
                      : "/images/logo.svg"
                    }`}
                  alt="WellMen"
                />
              </div>
            </Link>
            <div className="ml-auto flex items-center gap-2 justify-end">
              <button
                className="rbac-theme-toggle-mobile"
                type="button"
                onClick={toggleTheme}
                aria-label={`Switch to ${theme === "light" ? "dark" : "light"
                  } mode`}
                title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
              >
                {theme === "light" ? <FaMoon size={14} /> : <FaSun size={14} />}
              </button>
              <button
                className="rbac-hamburger"
                type="button"
                onClick={() => setNavOpen(true)}
              >
                <span />
              </button>
            </div>
          </div>
          <div className="">{loading ? <Loading /> : children}</div>
        </section>
      </main>
    </DashboardContext.Provider>
  );
}
