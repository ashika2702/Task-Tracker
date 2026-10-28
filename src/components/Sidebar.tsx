"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import ConfirmModal from "@/components/ConfirmModal";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  BarChart3,
  CalendarDays,
  LogOut,
  User,
  Menu,
  X,
  ArrowLeftFromLine,
} from "lucide-react";

interface SidebarProps {
  user?: {
    name?: string;
    username?: string;
    email?: string;
  };
}

export default function Sidebar({ user }: SidebarProps) {
  const safeUser = {
    name: user?.name || "Admin",
    username: user?.username || "admin",
    email: user?.email || "",
  };
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const navLinks = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/projects", label: "Projects", icon: FolderKanban },
    { href: "/tasks", label: "Tasks", icon: CheckSquare },
    { href: "/reports", label: "Time Reports", icon: BarChart3 },
    { href: "/attendance", label: "Attendance", icon: CalendarDays },
  ];

  return (
    <>
      {/* Mobile Top Header */}
      <div className="lg:hidden sticky top-0 z-40 bg-black border-b border-zinc-800 px-4 h-14 flex items-center justify-between text-white">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center p-1 flex-shrink-0 border border-white/10">
            <img src="/task_logo.png" alt="TaskFlow Logo" className="w-full h-full object-contain" />
          </div>
          <span className="font-extrabold text-white text-sm tracking-wider uppercase">
            TaskFlow
          </span>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Backdrop for mobile */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="lg:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
        />
      )}

      {/* Left Sidebar (sabols-web dark theme) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-black border-r border-[#1f2937] flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Top: Logo & Nav Links */}
        <div>
          {/* Logo Header */}
          <div className="h-16 px-5 flex items-center justify-between border-b border-[#1f2937]">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center p-1.5 flex-shrink-0 border border-white/10">
                <img src="/task_logo.png" alt="TaskFlow Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <span className="font-extrabold text-white leading-none text-sm tracking-wider uppercase block">
                  Task Tracker
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="px-3 py-5 space-y-1">
            

            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs transition-all ${
                    isActive
                      ? "bg-white/20 text-white font-semibold border border-white/10 shadow-sm"
                      : "text-gray-400 hover:text-white hover:bg-white/10 font-medium"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 flex-shrink-0 ${
                      isActive ? "text-white" : "text-gray-400"
                    }`}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Bottom: User Card & Logout (sabols-web style) */}
        <div className="p-4 border-t border-[#1f2937] space-y-3">
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="w-8 h-8 rounded-full bg-white/10 text-white font-bold flex items-center justify-center text-xs flex-shrink-0 border border-white/20">
              {safeUser.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate leading-tight">
                {safeUser.name}
              </p>
              <p className="text-[11px] text-gray-400 truncate font-normal">
                @{safeUser.username}
              </p>
            </div>
          </div>

          <button
            onClick={() => setConfirmLogoutOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium text-gray-300 hover:text-white hover:bg-white/10 border border-zinc-800 transition-colors"
          >
            <ArrowLeftFromLine className="w-4 h-4" />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmLogoutOpen}
        title="Sign Out"
        description="Are you sure you want to sign out?"
        confirmText="Sign Out"
        variant="info"
        onConfirm={handleLogout}
        onClose={() => setConfirmLogoutOpen(false)}
      />
    </>
  );
}
