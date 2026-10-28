"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, LogOut, ChevronDown } from "lucide-react";
import ConfirmModal from "@/components/ConfirmModal";

interface AdminHeaderProps {
  user: {
    name: string;
    username: string;
    email: string;
  };
  title?: string;
  children?: React.ReactNode;
}

export default function AdminHeader({ user, title = "Dashboard", children }: AdminHeaderProps) {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
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

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200/80 px-6 sm:px-8 lg:px-10 h-14 flex items-center justify-between">
      {/* Left: Page Title */}
      <div className="flex items-center gap-2">
        <h1 className="text-base font-bold text-slate-900 tracking-tight">
          {title}
        </h1>
      </div>

      {/* Right: Actions & User Avatar */}
      <div className="flex items-center gap-3">
        {children}

        {/* User Avatar & Dropdown */}
        <div className="relative pl-1 border-l border-slate-200/60">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-1.5 p-1 rounded-full hover:bg-slate-100 transition-colors text-slate-700"
            title="User profile"
          >
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {dropdownOpen && (
            <>
              <div
                onClick={() => setDropdownOpen(false)}
                className="fixed inset-0 z-40"
              />
              <div className="absolute right-0 mt-1.5 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl p-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="font-bold text-slate-900 truncate">{user.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">@{user.username}</p>
                </div>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    setConfirmLogoutOpen(true);
                  }}
                  className="w-full mt-1 flex items-center gap-2 px-3 py-2 rounded-xl text-slate-600 hover:text-red-600 hover:bg-red-50 font-medium transition-colors text-left"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

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
    </header>
  );
}
