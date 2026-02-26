"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import styles from "./layout.module.css";
import { THEME_STORAGE_KEY } from "@/lib/constants";

const NAV_GROUPS = [
  {
    label: "Daily Operations",
    items: [
      { href: "/dashboard/meals", label: "Meals", icon: "🍴" },
      { href: "/dashboard/activities", label: "Activities", icon: "🏃" },
      { href: "/dashboard/schedule", label: "Daily Schedule", icon: "📅" },
    ],
  },
  {
    label: "Facility",
    items: [
      { href: "/dashboard/housekeeping", label: "Housekeeping", icon: "🧹" },
      { href: "/dashboard/laundry", label: "Laundry", icon: "👕" },
    ],
  },
  {
    label: "Policies & Safety",
    items: [
      { href: "/dashboard/guidelines", label: "Guidelines", icon: "📖" },
      { href: "/dashboard/houserules", label: "House Rules", icon: "🏠" },
      { href: "/dashboard/emergency", label: "Emergency", icon: "🚨" },
    ],
  },
  {
    label: "People",
    items: [
      { href: "/dashboard/staff", label: "Staff", icon: "👥" },
      { href: "/dashboard/users", label: "Users & Roles", icon: "🔑" },
      { href: "/dashboard/medications", label: "Medications", icon: "💊" },
      { href: "/dashboard/assignments", label: "Assignments", icon: "🔗" },
    ],
  },
  {
    label: "Tools",
    items: [
      { href: "/dashboard/csv-upload", label: "CSV Upload", icon: "📤" },
      { href: "/dashboard/overrides", label: "Overrides", icon: "⚙️" },
    ],
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as "dark" | "light" | null;
    if (saved) {
      setTheme(saved);
      if (saved === "light") {
        document.documentElement.setAttribute("data-theme", "light");
      } else {
        document.documentElement.removeAttribute("data-theme");
      }
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem(THEME_STORAGE_KEY, next);
    if (next === "light") {
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  };

  const initialOpen: Record<string, boolean> = {};
  NAV_GROUPS.forEach((g) => {
    const hasActive = g.items.some((item) => pathname.startsWith(item.href));
    initialOpen[g.label] = hasActive;
  });
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(initialOpen);

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.mobileHeader}>
        <button
          className={styles.hamburger}
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
        >
          <span /><span /><span />
        </button>
        <div className={styles.mobileTitle}>
          <span>🏠</span>
          <span>Concierge</span>
        </div>
      </div>

      <div
        className={`${styles.overlay} ${sidebarOpen ? styles.overlayVisible : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}>
        <div className={styles.sidebarHeader}>
          <span className={styles.sidebarLogo}>🏠</span>
          <h1 className={styles.sidebarTitle}>Concierge</h1>
          <button
            className={styles.closeBtn}
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>
        <nav className={styles.nav}>
          {/* Overview - always visible at top */}
          <a
            href="/dashboard"
            className={`${styles.navItem} ${pathname === "/dashboard" ? styles.navItemActive : ""}`}
            onClick={(e) => { e.preventDefault(); router.push("/dashboard"); setSidebarOpen(false); }}
          >
            <span className={styles.navIcon}>📊</span>
            <span>Overview</span>
          </a>

          {/* Collapsible groups */}
          {NAV_GROUPS.map((group) => {
            const isOpen = openGroups[group.label] ?? false;
            const hasActive = group.items.some((item) =>
              item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href)
            );
            return (
              <div key={group.label} className={styles.navGroup}>
                <button
                  className={`${styles.navGroupHeader} ${hasActive ? styles.navGroupHeaderActive : ""}`}
                  onClick={() => toggleGroup(group.label)}
                >
                  <span>{group.label}</span>
                  <span className={`${styles.navGroupChevron} ${isOpen ? styles.navGroupChevronOpen : ""}`}>›</span>
                </button>
                {isOpen && (
                  <div className={styles.navGroupItems}>
                    {group.items.map((item) => {
                      const isActive = pathname.startsWith(item.href);
                      return (
                        <a
                          key={item.href}
                          href={item.href}
                          className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
                          onClick={(e) => { e.preventDefault(); router.push(item.href); setSidebarOpen(false); }}
                        >
                          <span className={styles.navIcon}>{item.icon}</span>
                          <span>{item.label}</span>
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
        <div className={styles.sidebarFooter}>
          <button onClick={toggleTheme} className={styles.themeBtn}>
            {theme === "dark" ? "☀️" : "🌙"} {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </button>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            🚪 Logout
          </button>
        </div>
      </aside>
      <main className={styles.content}>{children}</main>
    </div>
  );
}
