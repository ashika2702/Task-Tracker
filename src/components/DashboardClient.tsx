"use client";

import { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import DateNavigator from "@/components/DateNavigator";
import ProgressBar from "@/components/ProgressBar";
import TaskInput from "@/components/TaskInput";
import TaskItem, { Task, TaskStatus } from "@/components/TaskItem";
import { Loader2, CalendarX2 } from "lucide-react";

interface DashboardClientProps {
  initialUser: {
    name: string;
    username: string;
    email: string;
  };
}

export default function DashboardClient({ initialUser }: DashboardClientProps) {
  // Get today's local date as YYYY-MM-DD
  const getTodayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const [selectedDate, setSelectedDate] = useState<string>(getTodayStr());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch tasks for the selected date
  const loadTasks = useCallback(async (date: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks?date=${date}`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch (err) {
      console.error("Failed to load tasks:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks(selectedDate);
  }, [selectedDate, loadTasks]);

  // Handle adding a new task
  const handleAddTask = async (title: string) => {
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          date: selectedDate,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setTasks((prev) => [...prev, data.task]);
      }
    } catch (err) {
      console.error("Failed to add task:", err);
    }
  };

  // Handle updating task status
  const handleUpdateStatus = async (id: string, newStatus: TaskStatus) => {
    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              status: newStatus,
              completedAt: newStatus === "COMPLETED" ? new Date().toISOString() : null,
            }
          : t
      )
    );

    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        const data = await res.json();
        setTasks((prev) => prev.map((t) => (t.id === id ? data.task : t)));
      }
    } catch (err) {
      console.error("Failed to update status:", err);
      loadTasks(selectedDate); // Revert on failure
    }
  };

  // Handle editing task title
  const handleUpdateTitle = async (id: string, newTitle: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, title: newTitle } : t))
    );

    try {
      await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      });
    } catch (err) {
      console.error("Failed to update title:", err);
      loadTasks(selectedDate);
    }
  };

  // Handle deleting a task
  const handleDeleteTask = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));

    try {
      await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.error("Failed to delete task:", err);
      loadTasks(selectedDate);
    }
  };

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "COMPLETED").length;
  const inProgressTasks = tasks.filter((t) => t.status === "IN_PROGRESS").length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={initialUser} />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 space-y-6">
        {/* Date Navigator */}
        <DateNavigator
          selectedDate={selectedDate}
          onDateChange={(newDate) => setSelectedDate(newDate)}
        />

        {/* Daily Progress Bar */}
        <ProgressBar
          total={totalTasks}
          completed={completedTasks}
          inProgress={inProgressTasks}
        />

        {/* Quick Task Input */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 pl-1">
            Add New Task
          </label>
          <TaskInput onAddTask={handleAddTask} />
        </div>

        {/* Task List */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Tasks for this day ({totalTasks})
            </h2>
            {totalTasks > 0 && (
              <span className="text-xs text-slate-400">
                Double-click text to edit • Click status dot to cycle
              </span>
            )}
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
              <p className="text-xs font-medium">Loading your tasks...</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-3xl py-12 px-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
                <CalendarX2 className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-700">No tasks planned for this day</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Add your first task above to start planning and tracking your day.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {tasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onUpdateStatus={handleUpdateStatus}
                  onUpdateTitle={handleUpdateTitle}
                  onDelete={handleDeleteTask}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
