"use client";

interface ProgressBarProps {
  total: number;
  completed: number;
  inProgress: number;
}

export default function ProgressBar({ total, completed, inProgress }: ProgressBarProps) {
  if (total === 0) return null;

  const percentage = Math.round((completed / total) * 100);

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between text-xs font-semibold mb-2">
        <div className="flex items-center gap-3">
          <span className="text-slate-700">
            {completed} of {total} completed
          </span>
          {inProgress > 0 && (
            <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-medium">
              {inProgress} in progress
            </span>
          )}
        </div>
        <span className="text-indigo-600 font-bold">{percentage}%</span>
      </div>

      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
        <div
          className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
