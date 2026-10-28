"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Sidebar from "@/components/Sidebar";
import AdminHeader from "@/components/AdminHeader";
import ConfirmModal from "@/components/ConfirmModal";
import CustomDropdown, { DropdownOption } from "@/components/CustomDropdown";
import toast from "react-hot-toast";
import {
  CalendarDays,
  Table as TableIcon,
  Plus,
  ChevronLeft,
  ChevronRight,
  Home,
  Palmtree,
  Clock,
  Trash2,
  Edit3,
  X,
  Loader2,
  Calendar,
} from "lucide-react";

export type AttendanceType = "WFH" | "LEAVE" | "HALF_DAY";

export interface AttendanceRecord {
  id: string;
  userId: string;
  date: string;
  type: AttendanceType;
  note: string | null;
  createdAt: string;
}

interface AttendanceStats {
  wfhCount: number;
  leaveCount: number;
  halfDayCount: number;
  totalLogged: number;
}

interface AttendanceClientProps {
  user: {
    name: string;
    username: string;
    email: string;
  };
  initialRecords?: AttendanceRecord[];
  initialStats?: AttendanceStats;
  initialMonth?: number;
  initialYear?: number;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const WEEKDAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const MONTH_OPTIONS: DropdownOption[] = MONTH_NAMES.map((name, idx) => ({
  value: String(idx + 1),
  label: name,
}));

const YEAR_OPTIONS: DropdownOption[] = [2024, 2025, 2026, 2027, 2028].map((y) => ({
  value: String(y),
  label: String(y),
}));

export default function AttendanceClient({
  user,
  initialRecords = [],
  initialStats = { wfhCount: 0, leaveCount: 0, halfDayCount: 0, totalLogged: 0 },
  initialMonth,
  initialYear,
}: AttendanceClientProps) {
  const today = useMemo(() => new Date(), []);
  const [selectedMonth, setSelectedMonth] = useState<number>(initialMonth || today.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(initialYear || today.getFullYear());

  const [records, setRecords] = useState<AttendanceRecord[]>(initialRecords);
  const [stats, setStats] = useState<AttendanceStats>(initialStats);
  const [loading, setLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<"calendar" | "table">("calendar");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);

  // Form State
  const [formType, setFormType] = useState<AttendanceType>("WFH");
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [formNote, setFormNote] = useState("");
  const [formError, setFormError] = useState("");

  // Delete Confirm State
  const [recordToDelete, setRecordToDelete] = useState<AttendanceRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch data when month or year changes
  const fetchAttendance = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/attendance?month=${selectedMonth}&year=${selectedYear}`);
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records || []);
        setStats(data.stats || { wfhCount: 0, leaveCount: 0, halfDayCount: 0, totalLogged: 0 });
      }
    } catch (err) {
      console.error("Failed to load attendance records:", err);
      toast.error("Failed to load attendance records");
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  // Navigate Months
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((prev) => prev - 1);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((prev) => prev + 1);
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
  };

  const handleGoToToday = () => {
    setSelectedMonth(today.getMonth() + 1);
    setSelectedYear(today.getFullYear());
  };

  // Map of records by Date string (YYYY-MM-DD)
  const recordsByDate = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    for (const r of records) {
      const dStr = r.date.split("T")[0];
      map.set(dStr, r);
    }
    return map;
  }, [records]);

  // Open Create Modal (optionally with prefilled date)
  const openCreateModal = (prefillDate?: string) => {
    setEditingRecord(null);
    setFormType("WFH");
    const dStr = prefillDate || new Date().toISOString().split("T")[0];
    setFormStartDate(dStr);
    setFormEndDate("");
    setFormNote("");
    setFormError("");
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (rec: AttendanceRecord) => {
    setEditingRecord(rec);
    setFormType(rec.type);
    const dStr = rec.date.split("T")[0];
    setFormStartDate(dStr);
    setFormEndDate("");
    setFormNote(rec.note || "");
    setFormError("");
    setIsModalOpen(true);
  };

  // Submit Create or Edit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formStartDate) {
      setFormError("Please select a date.");
      return;
    }

    setSubmitting(true);
    setFormError("");

    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: formStartDate,
          endDate: formEndDate ? formEndDate : undefined,
          type: formType,
          note: formNote,
        }),
      });

      if (res.ok) {
        toast.success(editingRecord ? "Record updated." : "Attendance logged successfully.");
        setIsModalOpen(false);
        fetchAttendance();
      } else {
        const data = await res.json();
        setFormError(data.error || "Failed to save record.");
      }
    } catch (err: any) {
      setFormError(err.message || "Failed to save record.");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Record
  const confirmDelete = async () => {
    if (!recordToDelete) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/attendance?id=${recordToDelete.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Record removed.");
        setRecordToDelete(null);
        fetchAttendance();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete record.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete record.");
    } finally {
      setDeleting(false);
    }
  };

  // Generate Calendar Days for Selected Month
  const calendarDays = useMemo(() => {
    const year = selectedYear;
    const monthIndex = selectedMonth - 1;

    // First day of month
    const firstDate = new Date(year, monthIndex, 1);
    // Number of days in month
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

    // Day of week of 1st day (0 is Sun, 1 is Mon, etc. Let's make 0 = Mon, 6 = Sun)
    let startDayOfWeek = firstDate.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const days = [];

    // Empty slots before 1st of month
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({ dayNumber: null, dateStr: null });
    }

    // Days in current month
    for (let day = 1; day <= daysInMonth; day++) {
      const mStr = String(selectedMonth).padStart(2, "0");
      const dStr = String(day).padStart(2, "0");
      const dateStr = `${year}-${mStr}-${dStr}`;
      days.push({ dayNumber: day, dateStr });
    }

    return days;
  }, [selectedYear, selectedMonth]);

  const formatDateDisplay = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split("T")[0].split("-");
      const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col lg:flex-row">
      <Sidebar user={user} />

      <main className="flex-1 lg:pl-64 min-w-0 flex flex-col min-h-screen">
        <AdminHeader user={user} title="Attendance & Leaves">
          <button
            onClick={() => openCreateModal()}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0070f3] hover:bg-[#0060df] text-white text-xs font-semibold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Log Status</span>
          </button>
        </AdminHeader>

        <div className="w-full px-6 sm:px-8 lg:px-10 py-6 space-y-6 flex-1">
          {/* Top Bar: Dropdown Date Filters, Compact Metric Chips & View Switcher */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Left: Enhanced Dropdown Date Filter with Month & Year pickers */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-2xs"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <CustomDropdown
                value={String(selectedMonth)}
                onChange={(val) => setSelectedMonth(parseInt(val, 10))}
                options={MONTH_OPTIONS}
                triggerClassName="py-1.5 px-3 min-w-[130px] font-semibold text-xs shadow-2xs"
              />

              <CustomDropdown
                value={String(selectedYear)}
                onChange={(val) => setSelectedYear(parseInt(val, 10))}
                options={YEAR_OPTIONS}
                triggerClassName="py-1.5 px-3 min-w-[90px] font-semibold text-xs shadow-2xs"
              />

              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-2xs"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {(selectedMonth !== today.getMonth() + 1 || selectedYear !== today.getFullYear()) && (
                <button
                  onClick={handleGoToToday}
                  className="px-2.5 py-1 text-xs font-semibold text-[#0070f3] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors shadow-2xs"
                >
                  Today
                </button>
              )}
            </div>

            {/* Middle: Compact Stats Details (Clean inline pill chips - NO large cards!) */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* WFH Chip */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-50/80 border border-blue-200/80 text-xs shadow-2xs">
                <Home className="w-3.5 h-3.5 text-[#0070f3]" />
                <span className="text-slate-500 font-medium">WFH:</span>
                <span className="font-bold text-[#0070f3]">{stats.wfhCount} {stats.wfhCount === 1 ? "day" : "days"}</span>
              </div>

              {/* Leave Chip */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-50/80 border border-rose-200/80 text-xs shadow-2xs">
                <Palmtree className="w-3.5 h-3.5 text-rose-600" />
                <span className="text-slate-500 font-medium">Leaves:</span>
                <span className="font-bold text-rose-700">{stats.leaveCount} {stats.leaveCount === 1 ? "day" : "days"}</span>
              </div>

              {/* Half-Day Chip */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50/80 border border-amber-200/80 text-xs shadow-2xs">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-slate-500 font-medium">Half-Day:</span>
                <span className="font-bold text-amber-700">{stats.halfDayCount} {stats.halfDayCount === 1 ? "day" : "days"}</span>
              </div>
            </div>

            {/* Right: Calendar / Table Tab Switcher */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs self-start lg:self-auto">
              <button
                onClick={() => setActiveTab("calendar")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  activeTab === "calendar"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Calendar</span>
              </button>
              <button
                onClick={() => setActiveTab("table")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  activeTab === "table"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Table</span>
              </button>
            </div>
          </div>

          {/* Tab 1: Compact Monthly Calendar Grid View (Clean, low height!) */}
          {activeTab === "calendar" && (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden p-3.5 sm:p-5">
              {/* Day Headers (Mon - Sun) */}
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-1.5 text-center text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                {WEEKDAY_NAMES.map((w, idx) => (
                  <div key={w} className={`py-1 ${idx >= 5 ? "text-slate-300" : ""}`}>
                    {w}
                  </div>
                ))}
              </div>

              {/* Grid Cells: Shorter, compact height (h-[54px] sm:h-[62px]) */}
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                {calendarDays.map((cell, idx) => {
                  if (!cell.dayNumber || !cell.dateStr) {
                    return (
                      <div
                        key={`empty-${idx}`}
                        className="h-[78px] sm:h-[88px] rounded-xl bg-slate-50/40 border border-transparent"
                      />
                    );
                  }

                  const record = recordsByDate.get(cell.dateStr);
                  const isCurrentDay =
                    today.getDate() === cell.dayNumber &&
                    today.getMonth() + 1 === selectedMonth &&
                    today.getFullYear() === selectedYear;

                  const isWeekend = (idx % 7) >= 5;

                  return (
                    <div
                      key={cell.dateStr}
                      onClick={() => (record ? openEditModal(record) : openCreateModal(cell.dateStr))}
                      title={record ? (record.note ? `${record.type}: ${record.note}` : record.type) : undefined}
                      className={`h-[78px] sm:h-[88px] p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between group ${
                        isCurrentDay
                          ? "border-[#0070f3] bg-blue-50/20 shadow-2xs"
                          : isWeekend
                          ? "bg-slate-50/60 border-slate-100/80 hover:border-slate-200"
                          : "bg-white border-slate-200/80 hover:border-[#0070f3]/40 hover:shadow-2xs"
                      }`}
                    >
                      {/* Date Header */}
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-semibold leading-none ${
                            isCurrentDay
                              ? "w-6 h-6 rounded-full bg-[#0070f3] text-white flex items-center justify-center text-xs font-bold -ml-0.5 -mt-0.5"
                              : isWeekend
                              ? "text-slate-400"
                              : "text-slate-700"
                          }`}
                        >
                          {cell.dayNumber}
                        </span>

                        {!record && (
                          <span className="opacity-0 group-hover:opacity-100 text-[11px] text-[#0070f3] font-semibold transition-opacity">
                            + Log
                          </span>
                        )}
                      </div>

                      {/* Logged Status Badge */}
                      {record && (
                        <div>
                          {record.type === "WFH" && (
                            <div className="px-2 py-0.5 rounded-md bg-blue-50 text-[#0070f3] border border-blue-200/60 text-[11px] font-bold flex items-center gap-1.5 truncate">
                              <Home className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">WFH</span>
                            </div>
                          )}

                          {record.type === "LEAVE" && (
                            <div className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200/60 text-[11px] font-bold flex items-center gap-1.5 truncate">
                              <Palmtree className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">Leave</span>
                            </div>
                          )}

                          {record.type === "HALF_DAY" && (
                            <div className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/60 text-[11px] font-bold flex items-center gap-1.5 truncate">
                              <Clock className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">Half Day</span>
                            </div>
                          )}

                          {record.note && (
                            <span className="text-[10px] text-slate-400 truncate block mt-0.5 px-0.5" title={record.note}>
                              {record.note}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 2: Table List View */}
          {activeTab === "table" && (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
              {records.length === 0 ? (
                <div className="py-16 px-4 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto text-[#0070f3] mb-3">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">No records for {MONTH_NAMES[selectedMonth - 1]} {selectedYear}</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Click "Log Status" above or select any date in the calendar view to record a WFH or leave day.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs min-w-[650px]">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 uppercase tracking-wider font-semibold text-[11px] whitespace-nowrap">
                        <th className="py-3 px-4 w-[200px]">Date</th>
                        <th className="py-3 px-4 w-[140px]">Type</th>
                        <th className="py-3 px-4 min-w-[220px]">Note / Reason</th>
                        <th className="py-3 px-4 text-right w-[100px]">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {records.map((rec) => (
                        <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                            {formatDateDisplay(rec.date)}
                          </td>

                          <td className="py-3 px-4 whitespace-nowrap">
                            {rec.type === "WFH" && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-[#0070f3] border border-blue-200/80 font-bold text-[11px]">
                                <Home className="w-3 h-3" />
                                Work From Home
                              </span>
                            )}
                            {rec.type === "LEAVE" && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200/80 font-bold text-[11px]">
                                <Palmtree className="w-3 h-3" />
                                Full-Day Leave
                              </span>
                            )}
                            {rec.type === "HALF_DAY" && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200/80 font-bold text-[11px]">
                                <Clock className="w-3 h-3" />
                                Half Day
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-slate-600">
                            {rec.note ? rec.note : <span className="text-slate-300">—</span>}
                          </td>

                          <td className="py-3 px-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => openEditModal(rec)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                                title="Edit"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setRecordToDelete(rec)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Log Leave / WFH Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-[#0070f3]">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">
                  {editingRecord ? "Edit Record" : "Log Leave or WFH"}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type Selection Radio Cards */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Select Status Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {/* WFH Option */}
                  <button
                    type="button"
                    onClick={() => setFormType("WFH")}
                    className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                      formType === "WFH"
                        ? "border-[#0070f3] bg-blue-50 text-[#0070f3] font-bold shadow-2xs"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <Home className="w-4 h-4" />
                    <span className="text-xs">WFH</span>
                  </button>

                  {/* Leave Option */}
                  <button
                    type="button"
                    onClick={() => setFormType("LEAVE")}
                    className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                      formType === "LEAVE"
                        ? "border-rose-500 bg-rose-50 text-rose-700 font-bold shadow-2xs"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <Palmtree className="w-4 h-4" />
                    <span className="text-xs">Leave</span>
                  </button>

                  {/* Half-Day Option */}
                  <button
                    type="button"
                    onClick={() => setFormType("HALF_DAY")}
                    className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                      formType === "HALF_DAY"
                        ? "border-amber-500 bg-amber-50 text-amber-700 font-bold shadow-2xs"
                        : "border-slate-200 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    <span className="text-xs">Half Day</span>
                  </button>
                </div>
              </div>

              {/* Date Input */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {editingRecord || !formEndDate ? "Date" : "From Date"}
                  </label>
                  <input
                    type="date"
                    required
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0070f3]/20 focus:border-[#0070f3]"
                  />
                </div>

                {!editingRecord && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      To Date <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="date"
                      min={formStartDate}
                      value={formEndDate}
                      onChange={(e) => setFormEndDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0070f3]/20 focus:border-[#0070f3]"
                    />
                  </div>
                )}
              </div>

              {/* Note / Reason Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason or Note <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Doctor appointment, client site visit"
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0070f3]/20 focus:border-[#0070f3]"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0070f3] hover:bg-[#0060df] rounded-xl shadow-sm transition-all disabled:opacity-60"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingRecord ? "Save Changes" : "Confirm & Log"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmModal
        isOpen={!!recordToDelete}
        title="Remove Record?"
        description={
          recordToDelete
            ? `Are you sure you want to remove the ${recordToDelete.type} entry for ${formatDateDisplay(
                recordToDelete.date
              )}?`
            : ""
        }
        confirmText="Remove"
        variant="danger"
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setRecordToDelete(null)}
      />
    </div>
  );
}
