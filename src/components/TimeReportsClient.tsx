"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import AdminHeader from "@/components/AdminHeader";
import TaskDetailDrawer from "@/components/TaskDetailDrawer";
import CustomDropdown from "@/components/CustomDropdown";
import { AccordionSkeleton } from "@/components/SkeletonLoaders";
import {
  Clock,
  FolderKanban,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Loader2,
  BarChart3,
  Calendar,
  Layers,
  ArrowRight,
  Check,
  Play,
  Pause,
} from "lucide-react";

interface Project {
  id: string;
  name: string;
  code: string | null;
}

interface TaskActivity {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  timestamp: string;
  durationSeconds: number | null;
  note: string | null;
}

interface ReportTask {
  id: string;
  title: string;
  mainTitle: string;
  subTitle: string | null;
  status: "PENDING" | "IN_PROGRESS" | "PAUSED" | "COMPLETED";
  totalDurationSeconds: number;
  lastStartedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  project: {
    id: string;
    name: string;
    code: string | null;
  };
  activities: TaskActivity[];
}

interface SubTitleGroup {
  subTitle: string;
  totalDurationSeconds: number;
  tasks: ReportTask[];
}

interface MainTitleGroup {
  mainTitle: string;
  totalDurationSeconds: number;
  totalTasks: number;
  completedTasks: number;
  progressPercent: number;
  subTitles: SubTitleGroup[];
}

interface ReportData {
  project: { id: string; name: string; code: string | null } | null;
  stats: {
    totalDurationSeconds: number;
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    pausedTasks: number;
    pendingTasks: number;
    progressPercent: number;
  };
  mainTitleGroups: MainTitleGroup[];
}

interface TimeReportsClientProps {
  user: {
    name: string;
    username: string;
    email: string;
  };
  initialProjects?: Project[];
  initialReportData?: ReportData;
}

export default function TimeReportsClient({ user, initialProjects, initialReportData }: TimeReportsClientProps) {
  const [projects, setProjects] = useState<Project[]>(initialProjects || []);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("ALL");
  const [reportData, setReportData] = useState<ReportData | null>(initialReportData || null);
  const [loading, setLoading] = useState(!initialReportData);
  const isMounted = useRef(false);

  // Live 1-second ticker so active in-progress tasks update live on screen
  const [hasMounted, setHasMounted] = useState(false);
  const [ticker, setTicker] = useState(0);

  useEffect(() => {
    setHasMounted(true);
    const timer = setInterval(() => {
      setTicker((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Expanded Main Titles map (default all expanded)
  const [expandedMains, setExpandedMains] = useState<Record<string, boolean>>({});

  // Slide-over Timeline Drawer state
  const [selectedTaskIdForTimeline, setSelectedTaskIdForTimeline] = useState<string | null>(null);

  // Fetch Projects for dropdown
  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      }
    } catch (err) {
      console.error("Failed to load projects:", err);
    }
  };

  // Fetch Time Summary Report
  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const url = selectedProjectId === "ALL"
        ? "/api/reports/time-summary"
        : `/api/reports/time-summary?projectId=${selectedProjectId}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setReportData(data);

        // Initially do not expand modules (user will expand when clicked)
        setExpandedMains({});
      }
    } catch (err) {
      console.error("Failed to load report data:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    if (!initialProjects) {
      fetchProjects();
    }
  }, [initialProjects]);

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    fetchReport();
  }, [fetchReport]);

  const toggleMainExpand = (mainTitle: string) => {
    setExpandedMains((prev) => ({
      ...prev,
      [mainTitle]: !prev[mainTitle],
    }));
  };

  // Calculate live work duration for a task (including elapsed time if running)
  const getTaskLiveSeconds = useCallback((task: ReportTask) => {
    let secs = task.totalDurationSeconds || 0;
    if (hasMounted && task.status === "IN_PROGRESS" && task.lastStartedAt) {
      const elapsed = Math.max(0, Math.floor((Date.now() - new Date(task.lastStartedAt).getTime()) / 1000));
      secs += elapsed;
    }
    return secs;
  }, [ticker, hasMounted]);

  // Calculate live work duration for a subGroup
  const getSubGroupLiveSeconds = useCallback((subGroup: SubTitleGroup) => {
    return subGroup.tasks.reduce((sum, t) => sum + getTaskLiveSeconds(t), 0);
  }, [getTaskLiveSeconds]);

  // Calculate live work duration for a main group
  const getMainGroupLiveSeconds = useCallback((group: MainTitleGroup) => {
    return group.subTitles.reduce((sum, sg) => sum + getSubGroupLiveSeconds(sg), 0);
  }, [getSubGroupLiveSeconds]);

  // Calculate live total project duration
  const totalProjectLiveSeconds = useMemo(() => {
    if (!reportData) return 0;
    return reportData.mainTitleGroups.reduce((sum, g) => sum + getMainGroupLiveSeconds(g), 0);
  }, [reportData, getMainGroupLiveSeconds]);

  // Format seconds into clean readable string: e.g. "3h 24m 15s"
  const formatDurationFull = (seconds: number) => {
    if (!seconds || seconds <= 0) return "0s";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    const parts = [];
    if (hrs > 0) parts.push(`${hrs}h`);
    if (mins > 0 || hrs > 0) parts.push(`${mins}m`);
    parts.push(`${secs}s`);
    return parts.join(" ");
  };

  const formatDateTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col lg:flex-row">
      <Sidebar user={user} />

      <main className="flex-1 lg:pl-64 min-w-0 flex flex-col min-h-screen">
        <AdminHeader user={user} title="Time Reports">
          <div className="flex items-center gap-2.5">
            {/* Compact Live Total Work Time Pill */}
            {reportData && reportData.stats.totalTasks > 0 && (
              <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-xs font-bold text-[#0070f3]">
                <Clock className="w-3.5 h-3.5" />
                <span suppressHydrationWarning>Total: {formatDurationFull(totalProjectLiveSeconds)}</span>
              </div>
            )}

            {/* Project Switcher in Header */}
            <CustomDropdown
              value={selectedProjectId}
              onChange={(val) => setSelectedProjectId(val)}
              labelPrefix="Project:"
              prefixIcon={<FolderKanban className="w-3.5 h-3.5 text-slate-500" />}
              triggerClassName="py-1.5 shadow-sm"
              align="right"
              options={[
                { value: "ALL", label: "All Projects" },
                ...projects.map((p) => ({
                  value: p.id,
                  label: p.name,
                  badge: p.code || undefined,
                })),
              ]}
            />
          </div>
        </AdminHeader>

        <div className="w-full px-6 sm:px-8 lg:px-10 py-6 space-y-6 flex-1">
          {loading ? (
            <AccordionSkeleton count={3} />
          ) : !reportData || reportData.stats.totalTasks === 0 ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-3xl py-16 px-4 text-center max-w-md mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto text-[#0070f3] mb-3">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">No work logged yet</h3>
              <p className="text-xs text-slate-500 mt-1">
                Start tracking tasks in your project to view automatic time rollups and hierarchical breakdown.
              </p>
            </div>
          ) : (
            <>
              {/* Main Title (Module) Accordions / Cards */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Breakdown by Main Title (Module)
                  </h3>
                
                </div>

                {reportData.mainTitleGroups.map((group) => {
                  const isExpanded = expandedMains[group.mainTitle] ?? false;

                  return (
                    <div
                      key={group.mainTitle}
                      className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden transition-all"
                    >
                      {/* Main Title Header Bar */}
                      <div
                        onClick={() => toggleMainExpand(group.mainTitle)}
                        className="p-4 sm:p-5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/60 transition-colors select-none"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            type="button"
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                                {group.mainTitle}
                              </h4>
                              <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                {group.totalTasks} {group.totalTasks === 1 ? "task" : "tasks"}
                              </span>
                            </div>
                            <span className="text-xs text-slate-400 block mt-0.5">
                              {group.subTitles.length} {group.subTitles.length === 1 ? "category" : "categories"}
                            </span>
                          </div>
                        </div>

                        {/* Timing & Progress on Main Title */}
                        <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
                          <div className="text-right hidden sm:block">
                            <span className="text-xs font-bold text-slate-700 block">
                              {group.completedTasks} / {group.totalTasks} done
                            </span>
                            <span className="text-[10px] text-emerald-600 font-bold block">
                              {group.progressPercent}%
                            </span>
                          </div>

                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-[#0070f3] border border-blue-200/80 font-bold text-xs sm:text-sm">
                            <Clock className="w-3.5 h-3.5" />
                            <span suppressHydrationWarning>{formatDurationFull(getMainGroupLiveSeconds(group))}</span>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Subtitle & Tasks Area */}
                      {isExpanded && (
                        <div className="border-t border-slate-100 bg-[#fbfcfd] p-4 sm:p-5 space-y-5">
                          {group.subTitles.map((subGroup) => (
                            <div
                              key={subGroup.subTitle}
                              className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs"
                            >
                              {/* Subtitle Header */}
                              <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                                  <span className="text-xs font-bold text-slate-800">
                                    {subGroup.subTitle === "Default" ? "General Tasks" : subGroup.subTitle}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-medium">
                                    ({subGroup.tasks.length})
                                  </span>
                                </div>

                                <div className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  <span suppressHydrationWarning>{formatDurationFull(getSubGroupLiveSeconds(subGroup))}</span>
                                </div>
                              </div>

                              {/* Tasks Table */}
                              <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-xs">
                                  <thead>
                                    <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider text-[10px] font-semibold">
                                      <th className="py-2.5 px-4">Task Name</th>
                                      <th className="py-2.5 px-4 w-32">Status</th>
                                      <th className="py-2.5 px-4 w-36">Work Duration</th>
                                      <th className="py-2.5 px-4 w-44">Date</th>
                                      <th className="py-2.5 px-4 text-right w-28">Timeline</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {subGroup.tasks.map((task) => (
                                      <tr
                                        key={task.id}
                                        onClick={() => setSelectedTaskIdForTimeline(task.id)}
                                        className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                                      >
                                        <td className="py-3 px-4 font-medium text-slate-900">
                                          <span className="font-semibold text-slate-900">
                                            {task.title}
                                          </span>
                                        </td>

                                        <td className="py-3 px-4 whitespace-nowrap">
                                          {task.status === "COMPLETED" && (
                                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                              <Check className="w-3 h-3 stroke-[3]" />
                                              Completed
                                            </span>
                                          )}
                                          {task.status === "IN_PROGRESS" && (
                                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 animate-pulse">
                                              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                                              In Progress
                                            </span>
                                          )}
                                          {task.status === "PAUSED" && (
                                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                                              Paused
                                            </span>
                                          )}
                                          {task.status === "PENDING" && (
                                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                                              Pending
                                            </span>
                                          )}
                                        </td>

                                        <td className="py-3 px-4 whitespace-nowrap">
                                          <span suppressHydrationWarning className={`font-bold ${task.status === "IN_PROGRESS" ? "text-[#0070f3]" : "text-slate-700"}`}>
                                            {formatDurationFull(getTaskLiveSeconds(task))}
                                          </span>
                                        </td>

                                        <td suppressHydrationWarning className="py-3 px-4 whitespace-nowrap text-slate-400 text-[11px]">
                                          {task.completedAt
                                            ? `Completed: ${formatDateTime(task.completedAt)}`
                                            : `Created: ${formatDateTime(task.createdAt)}`}
                                        </td>

                                        <td className="py-3 px-4 whitespace-nowrap text-right">
                                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 group-hover:text-slate-800 transition-colors">
                                            <span>Inspect</span>
                                            <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Slide-over Timeline Drawer */}
        {selectedTaskIdForTimeline && (
          <TaskDetailDrawer
            taskId={selectedTaskIdForTimeline}
            onClose={() => setSelectedTaskIdForTimeline(null)}
          />
        )}
      </main>
    </div>
  );
}
