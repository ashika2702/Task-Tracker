"use client";

import { useState } from "react";
import { Check, Clock, Trash2, Edit2, PlayCircle, AlertCircle } from "lucide-react";

export type TaskStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  taskDate: string;
  status: TaskStatus;
  completedAt: string | null;
  createdAt: string;
}

interface TaskItemProps {
  task: Task;
  onUpdateStatus: (id: string, newStatus: TaskStatus) => Promise<void>;
  onUpdateTitle: (id: string, newTitle: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function TaskItem({
  task,
  onUpdateStatus,
  onUpdateTitle,
  onDelete,
}: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);
  const [isUpdating, setIsUpdating] = useState(false);

  // Format completion timestamp
  const formatCompletedTime = (dateStr: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleSaveTitle = async () => {
    if (!editedTitle.trim() || editedTitle === task.title) {
      setIsEditing(false);
      return;
    }
    setIsUpdating(true);
    try {
      await onUpdateTitle(task.id, editedTitle.trim());
      setIsEditing(false);
    } finally {
      setIsUpdating(false);
    }
  };

  // Next status in rotation: PENDING -> IN_PROGRESS -> COMPLETED -> PENDING
  const cycleStatus = async () => {
    if (isUpdating) return;
    setIsUpdating(true);
    let nextStatus: TaskStatus = "PENDING";
    if (task.status === "PENDING") nextStatus = "IN_PROGRESS";
    else if (task.status === "IN_PROGRESS") nextStatus = "COMPLETED";
    else nextStatus = "PENDING";

    try {
      await onUpdateStatus(task.id, nextStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div
      className={`group relative bg-white border rounded-2xl p-4 transition-all shadow-sm ${
        task.status === "COMPLETED"
          ? "border-emerald-200/80 bg-emerald-50/20"
          : task.status === "IN_PROGRESS"
          ? "border-blue-200/80 bg-blue-50/15"
          : "border-slate-200/80 hover:border-slate-300"
      }`}
    >
      <div className="flex items-start gap-3.5">
        {/* Quick Click Status Toggle Button */}
        <button
          onClick={cycleStatus}
          disabled={isUpdating}
          title="Click to cycle status: Pending ➔ In Progress ➔ Completed"
          className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center transition-all flex-shrink-0 border ${
            task.status === "COMPLETED"
              ? "bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-200"
              : task.status === "IN_PROGRESS"
              ? "bg-blue-500 border-blue-500 text-white shadow-sm shadow-blue-200 animate-pulse"
              : "border-slate-300 hover:border-amber-500 bg-white"
          }`}
        >
          {task.status === "COMPLETED" && <Check className="w-3.5 h-3.5 stroke-[3]" />}
          {task.status === "IN_PROGRESS" && <PlayCircle className="w-3.5 h-3.5" />}
          {task.status === "PENDING" && <span className="w-2 h-2 rounded-full bg-amber-400" />}
        </button>

        {/* Content area */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveTitle();
                  if (e.key === "Escape") {
                    setEditedTitle(task.title);
                    setIsEditing(false);
                  }
                }}
                autoFocus
                className="w-full text-sm font-medium border border-indigo-400 rounded-lg px-2.5 py-1 focus:outline-none ring-2 ring-indigo-500/20"
              />
              <button
                onClick={handleSaveTitle}
                className="text-xs font-semibold px-2.5 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Save
              </button>
            </div>
          ) : (
            <div className="flex flex-col">
              <p
                onDoubleClick={() => setIsEditing(true)}
                className="text-sm font-medium break-words leading-snug cursor-pointer text-slate-900"
              >
                {task.title}
              </p>

              {/* Completion or Status Details */}
              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                {task.status === "COMPLETED" && task.completedAt && (
                  <span className="inline-flex items-center gap-1 font-medium text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md text-[11px]">
                    <Check className="w-3 h-3 stroke-[2.5]" />
                    Completed at {formatCompletedTime(task.completedAt)}
                  </span>
                )}

                {task.status === "IN_PROGRESS" && (
                  <span className="inline-flex items-center gap-1 font-medium text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-md text-[11px]">
                    <Clock className="w-3 h-3" />
                    In Progress
                  </span>
                )}

                {task.status === "PENDING" && (
                  <span className="inline-flex items-center gap-1 font-medium text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-md text-[11px]">
                    <AlertCircle className="w-3 h-3" />
                    Pending
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Actions Menu */}
        <div className="flex items-center gap-1 flex-shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
          {/* Status Select dropdown for direct choosing */}
          <select
            value={task.status}
            onChange={(e) => onUpdateStatus(task.id, e.target.value as TaskStatus)}
            disabled={isUpdating}
            className="text-[11px] font-semibold rounded-lg border border-slate-200 bg-slate-50/80 px-2 py-1 text-slate-700 hover:bg-white focus:outline-none transition-colors"
          >
            <option value="PENDING">🟡 Pending</option>
            <option value="IN_PROGRESS">🔵 In Progress</option>
            <option value="COMPLETED">🟢 Completed</option>
          </select>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Edit task title"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onDelete(task.id)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Delete task"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
