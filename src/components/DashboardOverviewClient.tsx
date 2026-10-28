"use client";

import { useState, useEffect, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import AdminHeader from "@/components/AdminHeader";
import Link from "next/link";
import {
  FolderKanban,
  CheckSquare,
  Clock,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Plus,
  Loader2,
  TrendingUp,
  Pause,
  Hourglass,
} from "lucide-react";
import { DashboardMetricsSkeleton } from "@/components/SkeletonLoaders";

interface DashboardStats {
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pausedTasks: number;
  pendingTasks: number;
  completionRate: number;
  totalHours: string;
}

interface ProjectBreakdown {
  id: string;
  name: string;
  code: string | null;
  total: number;
  completed: number;
  percent: number;
}

interface RecentTask {
  id: string;
  title: string;
  completedAt: string | null;
  project: {
    name: string;
    code: string | null;
  };
}

interface DashboardOverviewClientProps {
  user: {
    name: string;
    username: string;
    email: string;
  };
  initialData?: {
    stats: DashboardStats;
    projectBreakdown: ProjectBreakdown[];
    recentCompleted: RecentTask[];
  };
}

export default function DashboardOverviewClient({ user, initialData }: DashboardOverviewClientProps) {
  const [stats, setStats] = useState<DashboardStats | null>(initialData?.stats || null);
  const [projectBreakdown, setProjectBreakdown] = useState<ProjectBreakdown[]>(initialData?.projectBreakdown || []);
  const [recentCompleted, setRecentCompleted] = useState<RecentTask[]>(initialData?.recentCompleted || []);
  const [loading, setLoading] = useState(!initialData);

  const fetchDashboardData = useCallback(async () => {
    if (!initialData) setLoading(true);
    try {
      const res = await fetch("/api/dashboard/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setProjectBreakdown(data.projectBreakdown || []);
        setRecentCompleted(data.recentCompleted || []);
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, [initialData]);

  useEffect(() => {
    if (!initialData) {
      fetchDashboardData();
    }
  }, [fetchDashboardData, initialData]);

  const formatCompletedTime = (dateStr: string | null) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col lg:flex-row">
      <Sidebar user={user} />

      {/* Main Container: Full Width! */}
      <main className="flex-1 lg:pl-64 min-w-0 flex flex-col min-h-screen">
        <AdminHeader user={user} title="Dashboard" />

        <div className="w-full px-6 sm:px-8 lg:px-10 py-6 space-y-6 flex-1">
          {/* Metric Cards Grid */}

          {/* Metric Cards Grid */}
          {loading ? (
            <DashboardMetricsSkeleton />
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {/* Total Projects */}
                <Link
                  href="/projects"
                  className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm hover:shadow transition-all group"
                >
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Projects
                    </span>
                    <FolderKanban className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {stats?.totalProjects || 0}
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">Workspaces</span>
                </Link>

                {/* Total Tasks */}
                <Link
                  href="/tasks"
                  className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm hover:shadow transition-all group"
                >
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Total Tasks
                    </span>
                    <CheckSquare className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {stats?.totalTasks || 0}
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">Across all</span>
                </Link>

                {/* Completed Tasks */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Completed
                    </span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="text-2xl font-bold text-emerald-600">
                    {stats?.completedTasks || 0}
                  </div>
                  <span className="text-[10px] text-emerald-700/80 font-semibold">
                    {stats?.completionRate || 0}% finished
                  </span>
                </div>

                {/* In Progress */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      In Progress
                    </span>
                    <Clock className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {stats?.inProgressTasks || 0}
                  </div>
                  <span className="text-[10px] text-blue-600 font-medium">Active work</span>
                </div>

                {/* Paused Tasks */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Paused
                    </span>
                    <Pause className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="text-2xl font-bold text-amber-600">
                    {stats?.pausedTasks || 0}
                  </div>
                  <span className="text-[10px] text-amber-600 font-medium">Clock stopped</span>
                </div>

                {/* Pending */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Pending
                    </span>
                    <AlertCircle className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="text-2xl font-bold text-slate-600">
                    {stats?.pendingTasks || 0}
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">Waiting to start</span>
                </div>
              </div>

              {/* Two-Column Section: Project Progress & Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Project Progress Breakdown (2 cols) */}
                <div className="lg:col-span-2 bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-indigo-500" />
                      <h2 className="text-sm font-bold text-slate-900">Project Progress Overview</h2>
                    </div>
                    <Link
                      href="/projects"
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group"
                    >
                      <span>All Projects</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </div>

                  {projectBreakdown.length === 0 ? (
                    <div className="py-10 text-center text-slate-400 text-xs">
                      No projects found. Create your first project to view progress.
                    </div>
                  ) : (
                    <div className="space-y-3.5 divide-y divide-slate-100">
                      {projectBreakdown.map((item) => (
                        <div key={item.id} className="pt-3 first:pt-0">
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <div className="flex items-center gap-2">
                              {item.code && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700">
                                  {item.code}
                                </span>
                              )}
                              <Link
                                href={`/tasks?projectId=${item.id}`}
                                className="font-bold text-slate-800 hover:text-indigo-600 transition-colors"
                              >
                                {item.name}
                              </Link>
                            </div>
                            <span className="font-semibold text-slate-500">
                              {item.completed} / {item.total} ({item.percent}%)
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${item.percent}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Completed Tasks (1 col) */}
                <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <h2 className="text-sm font-bold text-slate-900">Recently Completed</h2>
                    </div>
                    <Link
                      href="/tasks"
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                    >
                      View All
                    </Link>
                  </div>

                  {recentCompleted.length === 0 ? (
                    <div className="py-10 text-center text-slate-400 text-xs">
                      No completed tasks yet. Finish a task in the Tasks page to track it here!
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentCompleted.map((task) => (
                        <div
                          key={task.id}
                          className="p-3 rounded-2xl bg-slate-50/70 border border-slate-100 flex flex-col gap-1"
                        >
                          <span className="text-xs font-semibold text-slate-800">
                            {task.title}
                          </span>
                          <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <span className="text-indigo-600 font-medium">
                              {task.project.code ? `[${task.project.code}] ` : ""}
                              {task.project.name}
                            </span>
                            <span className="text-emerald-700 font-medium">
                              {formatCompletedTime(task.completedAt)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
