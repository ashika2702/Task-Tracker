"use client";

import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { useRef } from "react";

interface DateNavigatorProps {
  selectedDate: string; // "YYYY-MM-DD"
  onDateChange: (newDate: string) => void;
}

export default function DateNavigator({ selectedDate, onDateChange }: DateNavigatorProps) {
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Format date string for display
  const [year, month, day] = selectedDate.split("-").map(Number);
  const dateObj = new Date(year, month - 1, day);

  const todayObj = new Date();
  const todayStr = `${todayObj.getFullYear()}-${String(todayObj.getMonth() + 1).padStart(2, "0")}-${String(todayObj.getDate()).padStart(2, "0")}`;

  const isToday = selectedDate === todayStr;

  const yesterdayObj = new Date(todayObj);
  yesterdayObj.setDate(todayObj.getDate() - 1);
  const yesterdayStr = `${yesterdayObj.getFullYear()}-${String(yesterdayObj.getMonth() + 1).padStart(2, "0")}-${String(yesterdayObj.getDate()).padStart(2, "0")}`;
  const isYesterday = selectedDate === yesterdayStr;

  const tomorrowObj = new Date(todayObj);
  tomorrowObj.setDate(todayObj.getDate() + 1);
  const tomorrowStr = `${tomorrowObj.getFullYear()}-${String(tomorrowObj.getMonth() + 1).padStart(2, "0")}-${String(tomorrowObj.getDate()).padStart(2, "0")}`;
  const isTomorrow = selectedDate === tomorrowStr;

  let dayLabel = "";
  if (isToday) dayLabel = "Today";
  else if (isYesterday) dayLabel = "Yesterday";
  else if (isTomorrow) dayLabel = "Tomorrow";

  const formattedDate = dateObj.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const handlePrevDay = () => {
    const prev = new Date(year, month - 1, day - 1);
    const prevStr = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}-${String(prev.getDate()).padStart(2, "0")}`;
    onDateChange(prevStr);
  };

  const handleNextDay = () => {
    const next = new Date(year, month - 1, day + 1);
    const nextStr = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(next.getDate()).padStart(2, "0")}`;
    onDateChange(nextStr);
  };

  const handleToday = () => {
    onDateChange(todayStr);
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
      {/* Date Switcher */}
      <div className="flex items-center gap-2">
        <button
          onClick={handlePrevDay}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          title="Previous day"
          aria-label="Previous day"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="text-center sm:text-left min-w-[210px]">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span className="font-bold text-slate-900 text-lg leading-tight">
              {dayLabel ? `${dayLabel}, ` : ""}
              {dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
            {isToday && (
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Current
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 font-medium">
            {dateObj.toLocaleDateString("en-US", { weekday: "long", year: "numeric" })}
          </p>
        </div>

        <button
          onClick={handleNextDay}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          title="Next day"
          aria-label="Next day"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Quick shortcuts & Date Picker */}
      <div className="flex items-center gap-2">
        {!isToday && (
          <button
            onClick={handleToday}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            Jump to Today
          </button>
        )}

        <div className="relative">
          <button
            onClick={() => dateInputRef.current?.showPicker()}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white text-slate-600 hover:text-slate-900 transition-all shadow-sm"
            title="Pick a specific date"
          >
            <CalendarIcon className="w-3.5 h-3.5 text-indigo-500" />
            <span>Select Date</span>
          </button>

          {/* Hidden HTML5 date input triggered by calendar button */}
          <input
            ref={dateInputRef}
            type="date"
            value={selectedDate}
            onChange={(e) => {
              if (e.target.value) onDateChange(e.target.value);
            }}
            className="sr-only"
            tabIndex={-1}
          />
        </div>
      </div>
    </div>
  );
}
