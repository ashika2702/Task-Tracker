"use client";

import { AlertTriangle, Info, CheckCircle2, Pause, Play, LogOut, Trash2 } from "lucide-react";

export type ConfirmVariant = "danger" | "warning" | "success" | "info" | "primary";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
  onConfirm: () => void;
  onClose: () => void;
  loading?: boolean;
}

export default function ConfirmModal({
  isOpen,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "primary",
  onConfirm,
  onClose,
  loading = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const getIconAndColors = () => {
    switch (variant) {
      case "danger":
        return {
          icon: <Trash2 className="w-5 h-5 text-red-600" />,
          bg: "bg-red-50 border-red-100",
          button: "bg-red-600 hover:bg-red-700 text-white shadow-sm shadow-red-200",
        };
      case "warning":
        return {
          icon: <Pause className="w-5 h-5 text-blue-600 fill-current" />,
          bg: "bg-blue-50 border-blue-100",
          button: "bg-[#0070f3] hover:bg-[#0060df] text-white shadow-sm shadow-blue-200",
        };
      case "success":
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 stroke-[2.5]" />,
          bg: "bg-emerald-50 border-emerald-100",
          button: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-200",
        };
      case "info":
        return {
          icon: <LogOut className="w-5 h-5 text-slate-700" />,
          bg: "bg-slate-100 border-slate-200",
          button: "bg-slate-900 hover:bg-slate-800 text-white shadow-sm",
        };
      case "primary":
      default:
        return {
          icon: <Play className="w-5 h-5 text-blue-600 fill-current ml-0.5" />,
          bg: "bg-blue-50 border-blue-100",
          button: "bg-[#0070f3] hover:bg-[#0060df] text-white shadow-sm shadow-blue-200",
        };
    }
  };

  const { icon, bg, button } = getIconAndColors();

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 space-y-4"
      >
        <div className="flex items-start gap-3.5">
          <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center flex-shrink-0 ${bg}`}>
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-slate-900 leading-snug">
              {title}
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-end gap-2.5">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-60 flex items-center gap-1.5 ${button}`}
          >
            {loading ? "Processing..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
