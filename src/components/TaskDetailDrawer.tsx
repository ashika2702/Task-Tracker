"use client";

import { useState, useEffect, useCallback } from "react";
import {
  X,
  Loader2,
  Hourglass,
  Clock,
  Calendar,
} from "lucide-react";
import { TaskStatus } from "@/components/TasksClient";

interface TaskActivity {
  id: string;
  fromStatus: TaskStatus | null;
  toStatus: TaskStatus;
  timestamp: string;
  durationSeconds: number | null;
  note: string | null;
}

interface TaskDetailDrawerProps {
  taskId: string | null;
  onClose: () => void;
}

export default function TaskDetailDrawer({ taskId, onClose }: TaskDetailDrawerProps) {
  const [task, setTask] = useState<any>(null);
  const [activities, setActivities] = useState<TaskActivity[]>([]);
  const [loading, setLoading] = useState(true);

  // Live timer tick for currently running tasks
  const [liveSeconds, setLiveSeconds] = useState(0);

  const fetchTimeline = useCallback(async () => {
    if (!taskId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/timeline`);
      if (res.ok) {
        const data = await res.json();
        setTask(data.task);
        setActivities(data.task.activities || []);
      }
    } catch (err) {
      console.error("Failed to load timeline:", err);
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  // Live timer tick if task is currently IN_PROGRESS
  useEffect(() => {
    if (task?.status === "IN_PROGRESS" && task?.lastStartedAt) {
      const interval = setInterval(() => {
        const diffMs = new Date().getTime() - new Date(task.lastStartedAt).getTime();
        setLiveSeconds(Math.max(0, Math.floor(diffMs / 1000)));
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setLiveSeconds(0);
    }
  }, [task?.status, task?.lastStartedAt]);

  if (!taskId) return null;

  const formatSeconds = (totalSecs: number) => {
    if (!totalSecs || totalSecs <= 0) return "0s";
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;

    const parts = [];
    if (h > 0) parts.push(`${h}h`);
    if (m > 0 || h > 0) parts.push(`${m}m`);
    parts.push(`${s}s`);
    return parts.join(" ");
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const totalCalculatedWorkSeconds = (task?.totalDurationSeconds || 0) + liveSeconds;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm transition-opacity"
      />

      {/* Slide-over Drawer Panel */}
      <div className="fixed top-0 bottom-0 right-0 z-50 w-full sm:w-[480px] bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-3 bg-slate-50/50">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-1 flex-wrap text-xs text-slate-500">
              {task?.project?.code && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {task.project.code}
                </span>
              )}
              {task?.mainTitle && (
                <span className="font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                  {task.mainTitle}
                </span>
              )}
              {task?.subTitle && (
                <>
                  <span className="text-slate-300">›</span>
                  <span className="text-slate-600 bg-slate-50 border border-slate-200/60 px-1.5 py-0.5 rounded text-[11px]">
                    {task.subTitle}
                  </span>
                </>
              )}
            </div>
            <h2 className="text-base font-bold text-slate-900 leading-snug break-words">
              {task?.title || "Task Details"}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area - View Only */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              <p className="text-xs font-medium">Loading timeline...</p>
            </div>
          ) : (
            <>
              {/* Clean Summary */}
              <div className="space-y-3 pb-5 border-b border-slate-100">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Total Working Time
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-slate-900 tracking-tight">
                      {formatSeconds(totalCalculatedWorkSeconds)}
                    </span>
                    {task?.status === "IN_PROGRESS" && (
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 animate-pulse">
                        Running
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs pt-1">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Current Status</span>
                    <span className="font-semibold text-slate-900 mt-0.5 inline-block">
                      {task?.status === "COMPLETED" && (
                        <span className="text-emerald-700 font-bold">Completed</span>
                      )}
                      {task?.status === "IN_PROGRESS" && (
                        <span className="text-slate-900 font-bold">In Progress</span>
                      )}
                      {task?.status === "PAUSED" && (
                        <span className="text-slate-900 font-bold">Paused</span>
                      )}
                      {task?.status === "PENDING" && (
                        <span className="text-slate-600 font-medium">Pending</span>
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Created</span>
                    <span className="font-medium text-slate-700 mt-0.5 inline-block">
                      {formatDateTime(task?.createdAt)}
                    </span>
                  </div>
                </div>

                {task?.completedAt && (
                  <div className="text-xs">
                    <span className="text-slate-400 block text-[11px]">Completed At</span>
                    <span className="font-semibold text-emerald-700 mt-0.5 inline-block">
                      {formatDateTime(task.completedAt)}
                    </span>
                  </div>
                )}
              </div>

              {/* Description if present */}
              {task?.description && (
                <div className="space-y-1 pb-4 border-b border-slate-100">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Description
                  </span>
                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {task.description}
                  </p>
                </div>
              )}

              {/* Status Timeline - Sleek connector line, borderless clean entries */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Status Timeline
                  </h3>
                </div>

                {/* Timeline entries with sleek subtle connector line */}
                <div className="relative space-y-5 pl-1">
                  {activities.map((act, idx) => {
                    const isLast = idx === activities.length - 1;
                    return (
                      <div key={act.id} className="relative flex items-start gap-3.5">
                        {/* Sleek connector line between nodes (stops at the last node) */}
                        {!isLast && (
                          <span
                            className="absolute left-[6px] top-[18px] bottom-[-20px] w-[1.5px] bg-slate-200"
                            aria-hidden="true"
                          />
                        )}

                        {/* Status Node Dot */}
                        <div className="relative flex-shrink-0 mt-0.5">
                          <div
                            className={`w-3.5 h-3.5 rounded-full bg-white border-2 flex items-center justify-center shadow-2xs ${
                              act.toStatus === "COMPLETED"
                                ? "border-emerald-500"
                                : act.toStatus === "IN_PROGRESS"
                                ? "border-[#0070f3]"
                                : act.toStatus === "PAUSED"
                                ? "border-amber-500"
                                : "border-slate-400"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                act.toStatus === "COMPLETED"
                                  ? "bg-emerald-600"
                                  : act.toStatus === "IN_PROGRESS"
                                  ? "bg-[#0070f3]"
                                  : act.toStatus === "PAUSED"
                                  ? "bg-amber-500"
                                  : "bg-slate-400"
                              }`}
                            />
                          </div>
                        </div>

                        {/* Borderless Event Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-3 text-xs">
                            <span className="font-semibold text-slate-900">
                              {act.toStatus === "COMPLETED" && (
                                <span className="text-emerald-700 font-bold">
                                  Marked Completed
                                </span>
                              )}
                              {act.toStatus === "PAUSED" && (
                                <span>Work Paused</span>
                              )}
                              {act.toStatus === "IN_PROGRESS" && (
                                <span>
                                  {act.fromStatus === "PAUSED" ? "Work Resumed" : "Work Started"}
                                </span>
                              )}
                              {act.toStatus === "PENDING" && (
                                <span className="text-slate-700 font-medium">Task Created</span>
                              )}
                            </span>
                            <span className="text-[11px] font-normal text-slate-400 whitespace-nowrap">
                              {formatDateTime(act.timestamp)}
                            </span>
                          </div>

                          {/* Session Duration if worked */}
                          {act.durationSeconds !== null && act.durationSeconds > 0 && (
                            <div className="mt-1 text-[11px] font-semibold text-emerald-600 flex items-center gap-1.5">
                              <span className="w-1 h-1 rounded-full bg-emerald-500" />
                              <span>Session Duration: {formatSeconds(act.durationSeconds)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
