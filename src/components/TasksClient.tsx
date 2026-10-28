"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import AdminHeader from "@/components/AdminHeader";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import TaskDetailDrawer from "@/components/TaskDetailDrawer";
import {
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Trash2,
  Edit3,
  Loader2,
  X,
  Filter,
  FolderKanban,
  Check,
  Play,
  Pause,
  Lock,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import toast from "react-hot-toast";
import ConfirmModal, { ConfirmVariant } from "@/components/ConfirmModal";
import CustomDropdown from "@/components/CustomDropdown";
import { TaskRowSkeleton } from "@/components/SkeletonLoaders";

export type TaskStatus = "PENDING" | "IN_PROGRESS" | "PAUSED" | "COMPLETED";

interface Project {
  id: string;
  name: string;
  code: string | null;
}

interface Task {
  id: string;
  mainTitle: string;
  subTitle: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  totalDurationSeconds: number;
  lastStartedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  project: {
    id: string;
    name: string;
    code: string | null;
  };
}

interface StatusConfirm {
  taskId: string;
  taskTitle: string;
  targetStatus: TaskStatus;
  title: string;
  description: string;
  variant: ConfirmVariant;
  confirmText: string;
}

interface TasksClientProps {
  user: {
    name: string;
    username: string;
    email: string;
  };
  initialProjects?: Project[];
  initialTasks?: Task[];
}

export default function TasksClient({ user, initialProjects, initialTasks }: TasksClientProps) {
  const searchParams = useSearchParams();
  const initialProjectId = searchParams.get("projectId") || "ALL";

  const [tasks, setTasks] = useState<Task[]>(initialTasks || []);
  const [projects, setProjects] = useState<Project[]>(initialProjects || []);
  const [loading, setLoading] = useState(!initialTasks);
  const [projectsLoading, setProjectsLoading] = useState(!initialProjects);
  const isMounted = useRef(false);

  // Filters
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>(initialProjectId);
  const [selectedMainTitleFilter, setSelectedMainTitleFilter] = useState<string>("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Slide-over Timeline Drawer state
  const [selectedTaskIdForTimeline, setSelectedTaskIdForTimeline] = useState<string | null>(null);

  // Status Change Dialog Modal state
  const [statusModalTask, setStatusModalTask] = useState<Task | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Delete Task Confirm Modal state
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState(false);

  // Status Action Confirm Modal state (Complete, Pause, Resume, Start)
  const [statusConfirm, setStatusConfirm] = useState<StatusConfirm | null>(null);

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

  // Modal State for Create / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    mainTitle: "",
    subTitle: "",
    title: "",
    projectId: "",
    description: "",
  });
  const [isNewMainTitle, setIsNewMainTitle] = useState(false);
  const [isNewSubTitle, setIsNewSubTitle] = useState(false);
  const [existingTitlesHierarchy, setExistingTitlesHierarchy] = useState<{
    mainTitle: string;
    subTitles: string[];
  }[]>([]);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Fetch Projects for dropdowns
  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      }
    } catch (err) {
      console.error("Error fetching projects:", err);
    } finally {
      setProjectsLoading(false);
    }
  };

  // Fetch unique titles hierarchy for a project
  const fetchTitlesHierarchy = async (projectId: string) => {
    if (!projectId) {
      setExistingTitlesHierarchy([]);
      return;
    }
    try {
      const res = await fetch(`/api/tasks/titles?projectId=${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setExistingTitlesHierarchy(data.hierarchy || []);
      }
    } catch (err) {
      console.error("Error fetching titles hierarchy:", err);
    }
  };

  // Fetch Tasks with filters
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedProjectFilter !== "ALL") params.set("projectId", selectedProjectFilter);
      if (selectedMainTitleFilter !== "ALL") params.set("mainTitle", selectedMainTitleFilter);
      if (selectedStatusFilter !== "ALL") params.set("status", selectedStatusFilter);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());

      const res = await fetch(`/api/tasks?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch (err) {
      console.error("Error fetching tasks:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedProjectFilter, selectedMainTitleFilter, selectedStatusFilter, searchQuery]);

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
    fetchTasks();
  }, [fetchTasks]);

  // Available main titles in current task list for filter dropdown
  const availableMainTitles = useMemo(() => {
    const set = new Set<string>();
    for (const t of tasks) {
      if (t.mainTitle) set.add(t.mainTitle);
    }
    return Array.from(set).sort();
  }, [tasks]);

  // Subtitles for currently selected main title in form
  const currentMainSubtitles = useMemo(() => {
    if (!formData.mainTitle) return [];
    const found = existingTitlesHierarchy.find(
      (h) => h.mainTitle.toLowerCase() === formData.mainTitle.trim().toLowerCase()
    );
    return found ? found.subTitles : [];
  }, [formData.mainTitle, existingTitlesHierarchy]);

  // Reset to page 1 on filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedProjectFilter, selectedMainTitleFilter, selectedStatusFilter, searchQuery]);

  // Pagination calculations
  const totalTasksCount = tasks.length;
  const totalPages = Math.max(1, Math.ceil(totalTasksCount / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedTasks = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return tasks.slice(start, start + pageSize);
  }, [tasks, safeCurrentPage, pageSize]);

  const startDisplay = totalTasksCount === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endDisplay = Math.min(safeCurrentPage * pageSize, totalTasksCount);

  // Open Create Modal
  const openCreateModal = () => {
    setEditingTask(null);
    const defaultProj =
      projects.length > 0
        ? selectedProjectFilter !== "ALL"
          ? selectedProjectFilter
          : projects[0].id
        : "";
    setFormData({
      mainTitle: "",
      subTitle: "",
      title: "",
      projectId: defaultProj,
      description: "",
    });
    setIsNewMainTitle(false);
    setIsNewSubTitle(false);
    setFormError("");
    setIsModalOpen(true);
    if (defaultProj) {
      fetchTitlesHierarchy(defaultProj);
    }
  };

  // Open Edit Modal
  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setFormData({
      mainTitle: task.mainTitle || "General",
      subTitle: task.subTitle || "",
      title: task.title,
      projectId: task.project.id,
      description: task.description || "",
    });
    setIsNewMainTitle(false);
    setIsNewSubTitle(false);
    setFormError("");
    setIsModalOpen(true);
    fetchTitlesHierarchy(task.project.id);
  };

  // Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.projectId) {
      setFormError("Please select a project.");
      return;
    }
    if (!formData.mainTitle.trim()) {
      setFormError("Main Title is mandatory.");
      return;
    }
    if (!formData.title.trim()) {
      setFormError("Task Name is mandatory.");
      return;
    }

    setSubmitting(true);
    setFormError("");

    try {
      if (editingTask) {
        const res = await fetch(`/api/tasks/${editingTask.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to update task");
        }
      } else {
        const res = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            status: "PENDING", // Always starts as PENDING
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to create task");
        }
      }

      setIsModalOpen(false);
      fetchTasks();
    } catch (err: any) {
      setFormError(err.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Status Changes (Start, Pause, Resume, Complete)
  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Action not allowed.");
        return;
      }
      const data = await res.json();
      setTasks((prev) => prev.map((t) => (t.id === taskId ? data.task : t)));
      toast.success(
        newStatus === "IN_PROGRESS"
          ? "Task is now In Progress!"
          : newStatus === "PAUSED"
          ? "Task paused."
          : newStatus === "COMPLETED"
          ? "Task marked as completed!"
          : "Status updated."
      );
    } catch (err) {
      console.error("Failed to update status:", err);
      toast.error("Failed to update status.");
      fetchTasks();
    }
  };

  const handleApplyStatusFromDialog = (newStatus: TaskStatus) => {
    if (!statusModalTask) return;
    const task = statusModalTask;
    setStatusModalTask(null);

    if (newStatus === "COMPLETED") {
      setStatusConfirm({
        taskId: task.id,
        taskTitle: task.title,
        targetStatus: "COMPLETED",
        title: "Mark as Completed",
        description: `Are you sure you want to complete "${task.title}"?`,
        variant: "success",
        confirmText: "Mark Completed",
      });
    } else if (newStatus === "PAUSED") {
      setStatusConfirm({
        taskId: task.id,
        taskTitle: task.title,
        targetStatus: "PAUSED",
        title: "Pause Task",
        description: `Are you sure you want to pause "${task.title}"?`,
        variant: "primary",
        confirmText: "Pause Task",
      });
    } else if (newStatus === "IN_PROGRESS") {
      const isResume = task.status === "PAUSED";
      setStatusConfirm({
        taskId: task.id,
        taskTitle: task.title,
        targetStatus: "IN_PROGRESS",
        title: isResume ? "Resume Task" : "Start Task",
        description: isResume
          ? `Are you sure you want to resume "${task.title}"?`
          : `Are you sure you want to start "${task.title}"?`,
        variant: "primary",
        confirmText: isResume ? "Resume Task" : "Start Task",
      });
    }
  };

  const executeStatusChange = async () => {
    if (!statusConfirm) return;
    setUpdatingStatus(true);
    try {
      await handleStatusChange(statusConfirm.taskId, statusConfirm.targetStatus);
      setStatusConfirm(null);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Delete Task (Only allowed if PENDING)
  const handleDeleteTask = (task: Task) => {
    if (task.status !== "PENDING") {
      toast.error("Tasks that have already been started cannot be deleted to preserve history.");
      return;
    }
    setTaskToDelete(task);
  };

  const executeDeleteTask = async () => {
    if (!taskToDelete) return;
    setDeletingTask(true);
    try {
      const res = await fetch(`/api/tasks/${taskToDelete.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to delete task.");
        return;
      }

      setTasks((prev) => prev.filter((t) => t.id !== taskToDelete.id));
      if (selectedTaskIdForTimeline === taskToDelete.id) {
        setSelectedTaskIdForTimeline(null);
      }
      toast.success(`Task "${taskToDelete.title}" deleted.`);
      setTaskToDelete(null);
    } catch (err: any) {
      console.error("Failed to delete task:", err);
      toast.error(err.message || "Failed to delete task.");
    } finally {
      setDeletingTask(false);
    }
  };

  // Calculate live work duration for a task (including elapsed time if running)
  const getTaskLiveSeconds = useCallback(
    (task: Task) => {
      let secs = task.totalDurationSeconds || 0;
      if (hasMounted && task.status === "IN_PROGRESS" && task.lastStartedAt) {
        const elapsed = Math.max(0, Math.floor((Date.now() - new Date(task.lastStartedAt).getTime()) / 1000));
        secs += elapsed;
      }
      return secs;
    },
    [ticker, hasMounted]
  );

  // Format seconds to compact "Xh Ym Zs"
  const formatCompactDuration = (seconds: number) => {
    if (!seconds || seconds <= 0) return "0s";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return "—";
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

      {/* Main Container: Full Width with AdminHeader! */}
      <main className="flex-1 lg:pl-64 min-w-0 flex flex-col min-h-screen">
        <AdminHeader user={user} title="Tasks">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Project Filter in Header */}
            <CustomDropdown
              value={selectedProjectFilter}
              onChange={(val) => setSelectedProjectFilter(val)}
              labelPrefix="Project:"
              prefixIcon={<FolderKanban className="w-3.5 h-3.5 text-slate-500" />}
              triggerClassName="py-1.5 shadow-sm"
              options={[
                { value: "ALL", label: "All Projects" },
                ...projects.map((p) => ({
                  value: p.id,
                  label: p.name,
                  badge: p.code || undefined,
                })),
              ]}
            />

            {/* Main Title Filter in Header */}
            {availableMainTitles.length > 0 && (
              <CustomDropdown
                value={selectedMainTitleFilter}
                onChange={(val) => setSelectedMainTitleFilter(val)}
                labelPrefix="Title:"
                triggerClassName="py-1.5 shadow-sm"
                options={[
                  { value: "ALL", label: "All Titles" },
                  ...availableMainTitles.map((mt) => ({
                    value: mt,
                    label: mt,
                  })),
                ]}
              />
            )}

            {/* Primary Action Button "Add Task" in #0070f3 blue */}
            <button
              onClick={openCreateModal}
              disabled={projectsLoading || projects.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0070f3] hover:bg-[#0060df] disabled:opacity-60 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Task</span>
            </button>
          </div>
        </AdminHeader>

        <div className="w-full px-6 sm:px-8 lg:px-10 py-6 space-y-4 flex-1">

          {/* Warning if no projects exist (only shown after both projects & tasks finish loading) */}
          {!projectsLoading && !loading && projects.length === 0 && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>You don&apos;t have any projects yet. Tasks must be assigned to a project.</span>
              </div>
              <Link
                href="/projects"
                className="px-3 py-1.5 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 flex-shrink-0"
              >
                Create a Project first
              </Link>
            </div>
          )}

          {/* Compact Filter Row: Status Pills on Left, Search Bar on Right */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Status Filter Tabs (Pill Buttons) on the Left */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <div className="flex items-center gap-1 text-xs font-semibold text-slate-500 mr-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span>Status:</span>
              </div>

              {[
                { value: "ALL", label: "All Statuses" },
                { value: "PENDING", label: "Pending", dot: "bg-slate-400" },
                { value: "IN_PROGRESS", label: "In Progress", dot: "bg-blue-500 animate-pulse" },
                { value: "PAUSED", label: "Paused", dot: "bg-blue-500" },
                { value: "COMPLETED", label: "Completed", icon: <Check className="w-3 h-3 stroke-[2.5]" /> },
              ].map((opt) => {
                const isSelected = selectedStatusFilter === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setSelectedStatusFilter(opt.value)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#0070f3] text-white shadow-sm shadow-blue-200"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 bg-white border border-slate-200 shadow-sm"
                    }`}
                  >
                    {opt.dot && (
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isSelected ? "bg-white" : opt.dot
                        }`}
                      />
                    )}
                    {opt.icon && (
                      <span className={isSelected ? "text-white" : "text-emerald-600"}>
                        {opt.icon}
                      </span>
                    )}
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Search Bar on the Right */}
            <div className="relative w-full md:w-80 sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks..."
                className="w-full pl-9 pr-9 py-1.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0070f3]/20 focus:border-[#0070f3] transition-all shadow-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-md"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Table Card (matching Supported Pincodes card from screenshot) */}
          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden">
            {/* Card Header */}
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Task List</h2>
                
              </div>

              <div className="flex items-center gap-2 text-xs font-medium">
                {(selectedProjectFilter !== "ALL" || selectedStatusFilter !== "ALL" || searchQuery.trim().length > 0) && (
                  <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-bold text-[11px] border border-blue-200">
                    Filtered Results
                  </span>
                )}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs min-w-[960px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 uppercase tracking-wider font-semibold text-[11px] whitespace-nowrap">
                    <th className="py-3 px-4 w-[190px] min-w-[170px]">Task Name</th>
                    <th className="py-3 px-4 w-[160px] min-w-[140px]">Project</th>
                    <th className="py-3 px-4 w-[130px] min-w-[120px]">Status</th>
                    <th className="py-3 px-4 w-[140px] min-w-[130px]">Active Work Time</th>
                    <th className="py-3 px-4 w-[160px] min-w-[150px]">Created Date</th>
                    <th className="py-3 px-4 w-[160px] min-w-[150px]">Completed Date</th>
                    <th className="py-3 px-4 text-right w-[120px] min-w-[110px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <TaskRowSkeleton rows={6} />
                  ) : tasks.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 px-4 text-center">
                        <p className="text-sm font-semibold text-slate-700">No tasks found</p>
                        <p className="text-xs text-slate-400 mt-1">
                          {projects.length === 0
                            ? "Please create a project first to start adding tasks."
                            : "Click 'Create Task' above to add your first task to the table."}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    paginatedTasks.map((task) => (
                      <tr
                        key={task.id}
                        onClick={() => setSelectedTaskIdForTimeline(task.id)}
                        className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      >
                        {/* Task Name & Description */}
                        <td className="py-3.5 px-4 font-medium text-slate-900 w-[190px] min-w-[170px] whitespace-nowrap">
                          <div className="flex flex-col">
                            {/* Hierarchy Breadcrumb Badges */}
                            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 mb-0.5 whitespace-nowrap">
                              <span className="font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[10px] truncate max-w-[90px]">
                                {task.mainTitle || "General"}
                              </span>
                              {task.subTitle && (
                                <>
                                  <span className="text-slate-300">›</span>
                                  <span className="text-slate-600 bg-slate-50 border border-slate-200/60 px-1.5 py-0.5 rounded text-[10px] truncate max-w-[90px]">
                                    {task.subTitle}
                                  </span>
                                </>
                              )}
                            </div>
                            <span className="text-slate-900 font-semibold transition-colors truncate block max-w-[180px]" title={task.title}>
                              {task.title}
                            </span>
                            {task.description && (
                              <span className="text-[11px] text-slate-400 font-normal truncate block max-w-[180px] mt-0.5" title={task.description}>
                                {task.description}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Project Badge */}
                        <td className="py-3.5 px-4 whitespace-nowrap w-[160px] min-w-[140px]">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium truncate max-w-[155px]">
                            <FolderKanban className="w-3 h-3 text-slate-400 flex-shrink-0" />
                            {task.project.code && (
                              <span className="font-bold text-[#0070f3] flex-shrink-0">
                                [{task.project.code}]
                              </span>
                            )}
                            <span className="truncate">{task.project.name}</span>
                          </span>
                        </td>

                        {/* Status Badge */}
                        <td className="py-3.5 px-4 whitespace-nowrap w-[130px] min-w-[120px]">
                          {task.status === "COMPLETED" && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                              Completed
                            </span>
                          )}
                          {task.status === "IN_PROGRESS" && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 animate-pulse">
                              <span className="w-2 h-2 rounded-full bg-blue-600" />
                              In Progress
                            </span>
                          )}
                          {task.status === "PAUSED" && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                              <span className="w-2 h-2 rounded-full bg-blue-600" />
                              Paused
                            </span>
                          )}
                          {task.status === "PENDING" && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                              <span className="w-2 h-2 rounded-full bg-slate-400" />
                              Pending
                            </span>
                          )}
                        </td>

                        {/* Active Work Time (Excludes pause!) */}
                        <td className="py-3.5 px-4 whitespace-nowrap w-[140px] min-w-[130px]">
                          <span
                            suppressHydrationWarning
                            className={`font-semibold ${
                              task.status === "IN_PROGRESS" ? "text-[#0070f3]" : "text-slate-700"
                            }`}
                          >
                            {task.status === "PENDING" && (!task.totalDurationSeconds || task.totalDurationSeconds === 0)
                              ? "—"
                              : formatCompactDuration(getTaskLiveSeconds(task))}
                          </span>
                        </td>

                        {/* Created Date (Placed BEFORE Completed Date!) */}
                        <td suppressHydrationWarning className="py-3.5 px-4 whitespace-nowrap text-slate-500 w-[160px] min-w-[150px]">
                          {formatDateTime(task.createdAt)}
                        </td>

                        {/* Completed Date */}
                        <td suppressHydrationWarning className="py-3.5 px-4 whitespace-nowrap text-slate-500 w-[160px] min-w-[150px]">
                          {task.status === "COMPLETED" && task.completedAt ? (
                            <span className="inline-flex items-center gap-1 font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md text-[11px]">
                              <Check className="w-3 h-3 stroke-[2.5]" />
                              {formatDateTime(task.completedAt)}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        {/* Unified Actions Column: Common Status Button, Edit & Delete */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-right w-[130px] min-w-[120px]">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Single Common Status Action Button */}
                            {task.status !== "COMPLETED" ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setStatusModalTask(task);
                                }}
                                className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#0070f3] transition-colors"
                                title="Change Status (Start, Pause, Resume, Complete)"
                              >
                                <SlidersHorizontal className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <span
                                className="p-1.5 text-slate-300"
                                title="Status is finalized and locked"
                              >
                                <Lock className="w-3.5 h-3.5" />
                              </span>
                            )}

                            {/* Edit (only if not completed) */}
                            {task.status !== "COMPLETED" && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditModal(task);
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                                title="Edit task"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Delete (ONLY allowed if PENDING. Disabled if started!) */}
                            {task.status === "PENDING" ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteTask(task);
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                title="Delete task"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button
                                disabled
                                onClick={(e) => e.stopPropagation()}
                                className="p-1.5 rounded-lg text-slate-200 cursor-not-allowed"
                                title="Started tasks cannot be deleted to preserve history"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                </table>
              </div>

            {/* Table Footer with Pagination matching exact user design */}
            {!loading && totalTasksCount > 0 && (
              <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-between sm:justify-end gap-3 sm:gap-5 bg-white select-none">
                {/* 1 - 25 of 20770 ⌵ with Custom Dropdown */}
                <CustomDropdown
                  value={String(pageSize)}
                  onChange={(val) => {
                    setPageSize(Number(val));
                    setCurrentPage(1);
                  }}
                  options={[
                    { value: "10", label: "10 per page" },
                    { value: "25", label: "25 per page" },
                    { value: "50", label: "50 per page" },
                    { value: "100", label: "100 per page" },
                  ]}
                  menuClassName="bottom-full mb-1.5"
                  renderTrigger={(selected, isOpen) => (
                    <div className="flex items-center gap-1.5 cursor-pointer text-xs sm:text-sm font-bold text-slate-800 hover:text-slate-900 group">
                      <span>{startDisplay} - {endDisplay}</span>
                      <span className="font-normal text-slate-400">of</span>
                      <span>{totalTasksCount}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-transform duration-200 ml-0.5 ${
                          isOpen ? "rotate-180 text-[#0070f3]" : ""
                        }`}
                      />
                    </div>
                  )}
                />

                {/* [ < ] Previous Page Button */}
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safeCurrentPage <= 1}
                  className="w-9 h-9 rounded-xl border border-blue-200/90 bg-white hover:bg-slate-50 text-slate-700 flex items-center justify-center shadow-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                  title="Previous page"
                >
                  <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
                </button>

                {/* Page 1 of 831 */}
                <span className="text-xs sm:text-sm font-bold text-slate-900 whitespace-nowrap">
                  Page {safeCurrentPage} of {totalPages}
                </span>

                {/* [ > ] Next Page Button */}
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safeCurrentPage >= totalPages}
                  className="w-9 h-9 rounded-xl border border-blue-200/90 bg-white hover:bg-slate-50 text-slate-700 flex items-center justify-center shadow-sm disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                  title="Next page"
                >
                  <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            )}
          </div>

          {/* Slide-over Timeline Drawer */}
          {selectedTaskIdForTimeline && (
            <TaskDetailDrawer
              taskId={selectedTaskIdForTimeline}
              onClose={() => setSelectedTaskIdForTimeline(null)}
            />
          )}

          {/* Create / Edit Task Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                  <h3 className="font-bold text-slate-900 text-base">
                    {editingTask ? "Edit Task" : "Create New Task"}
                  </h3>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
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
                  {/* Project / Product Selection */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Assign to Project / Product <span className="text-red-500">*</span>
                    </label>
                    <CustomDropdown
                      value={formData.projectId}
                      onChange={(newProj) => {
                        setFormData({ ...formData, projectId: newProj, mainTitle: "", subTitle: "" });
                        fetchTitlesHierarchy(newProj);
                      }}
                      placeholder="Select a project"
                      className="w-full"
                      triggerClassName="w-full justify-between py-2.5 px-3.5 bg-white text-sm"
                      menuClassName="w-full"
                      options={projects.map((p) => ({
                        value: p.id,
                        label: p.name,
                        badge: p.code || undefined,
                      }))}
                    />
                  </div>

                  {/* Main Title (Module / Group) */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700">
                        Main Title <span className="text-red-500">*</span>
                      </label>
                      {existingTitlesHierarchy.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsNewMainTitle(!isNewMainTitle);
                            setFormData((prev) => ({ ...prev, mainTitle: "", subTitle: "" }));
                          }}
                          className="text-[11px] font-semibold text-[#0070f3] hover:underline cursor-pointer"
                        >
                          {isNewMainTitle ? "Select existing title" : "+ Create new title"}
                        </button>
                      )}
                    </div>

                    {!isNewMainTitle && existingTitlesHierarchy.length > 0 ? (
                      <CustomDropdown
                        value={formData.mainTitle}
                        onChange={(val) => {
                          setFormData({ ...formData, mainTitle: val, subTitle: "" });
                        }}
                        placeholder="Select an existing Main Title..."
                        className="w-full"
                        triggerClassName="w-full justify-between py-2.5 px-3.5 bg-white text-sm"
                        menuClassName="w-full"
                        options={existingTitlesHierarchy.map((h) => ({
                          value: h.mainTitle,
                          label: h.mainTitle,
                        }))}
                      />
                    ) : (
                      <input
                        type="text"
                        required
                        value={formData.mainTitle}
                        onChange={(e) => setFormData({ ...formData, mainTitle: e.target.value })}
                        placeholder="e.g. Stock Management, Authentication"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0070f3]/20 focus:border-[#0070f3]"
                      />
                    )}
                  </div>

                  {/* Subtitle / Subtask Category */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700">
                        Subtitle / Subtask <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      {currentMainSubtitles.length > 0 && !isNewMainTitle && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsNewSubTitle(!isNewSubTitle);
                            setFormData((prev) => ({ ...prev, subTitle: "" }));
                          }}
                          className="text-[11px] font-semibold text-[#0070f3] hover:underline cursor-pointer"
                        >
                          {isNewSubTitle ? "Select existing subtitle" : "+ Create new subtitle"}
                        </button>
                      )}
                    </div>

                    {!isNewSubTitle && currentMainSubtitles.length > 0 && !isNewMainTitle ? (
                      <CustomDropdown
                        value={formData.subTitle || ""}
                        onChange={(val) => {
                          setFormData({ ...formData, subTitle: val });
                        }}
                        placeholder="None / No Subtitle"
                        className="w-full"
                        triggerClassName="w-full justify-between py-2.5 px-3.5 bg-white text-sm"
                        menuClassName="w-full"
                        options={[
                          { value: "", label: "None / No Subtitle" },
                          ...currentMainSubtitles.map((sub) => ({
                            value: sub,
                            label: sub,
                          })),
                        ]}
                      />
                    ) : (
                      <input
                        type="text"
                        value={formData.subTitle}
                        onChange={(e) => setFormData({ ...formData, subTitle: e.target.value })}
                        placeholder="e.g. Reports, Configuration (Optional)"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0070f3]/20 focus:border-[#0070f3]"
                      />
                    )}
                  </div>

                  {/* Task Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Task Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. Daily Report, Configure Products"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0070f3]/20 focus:border-[#0070f3]"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Description <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <textarea
                      rows={3}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Add details, acceptance criteria, or notes..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0070f3]/20 focus:border-[#0070f3] resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 rounded-xl bg-[#0070f3] hover:bg-[#0060df] disabled:opacity-70 text-white text-xs font-semibold transition-all flex items-center gap-1.5"
                    >
                      {submitting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{editingTask ? "Save Changes" : "Create Task"}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Dedicated Status Change Dialog Modal */}
          {statusModalTask && (
            <div
              onClick={() => setStatusModalTask(null)}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 space-y-5"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {statusModalTask.project.code && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {statusModalTask.project.code}
                        </span>
                      )}
                      <span className="text-xs font-semibold text-slate-500">
                        {statusModalTask.project.name}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-base leading-snug break-words">
                      {statusModalTask.title}
                    </h3>
                  </div>
                  <button
                    onClick={() => setStatusModalTask(null)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Current Status Pill */}
                {/* Current Status Pill - Clean Blue / Green / Neutral */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100 text-xs">
                  <span className="text-slate-500 font-medium">Current Status</span>
                  <span>
                    {statusModalTask.status === "PENDING" && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-200 text-slate-700 text-xs font-bold">
                        Pending
                      </span>
                    )}
                    {statusModalTask.status === "IN_PROGRESS" && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold">
                        <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                        In Progress
                      </span>
                    )}
                    {statusModalTask.status === "PAUSED" && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold">
                        <span className="w-2 h-2 rounded-full bg-blue-600" />
                        Paused
                      </span>
                    )}
                  </span>
                </div>

                {/* Status Transition Action Buttons - Clean Blue & Green Only in 2-Column Grid */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-slate-700">Select New Status Action:</p>

                  {/* 1. START (if PENDING) */}
                  {statusModalTask.status === "PENDING" && (
                    <button
                      type="button"
                      disabled={updatingStatus}
                      onClick={() => handleApplyStatusFromDialog("IN_PROGRESS")}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#0070f3] hover:bg-[#0060df] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-60"
                    >
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                      <span>Start Task</span>
                    </button>
                  )}

                  {/* 2. PAUSE & MARK COMPLETED (if IN_PROGRESS) -> Compact Blue & Green Buttons */}
                  {statusModalTask.status === "IN_PROGRESS" && (
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        disabled={updatingStatus}
                        onClick={() => handleApplyStatusFromDialog("PAUSED")}
                        className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition-all cursor-pointer disabled:opacity-60"
                      >
                        <Pause className="w-3.5 h-3.5 fill-current" />
                        <span>Pause</span>
                      </button>

                      <button
                        type="button"
                        disabled={updatingStatus}
                        onClick={() => handleApplyStatusFromDialog("COMPLETED")}
                        className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-60"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Mark as Completed</span>
                      </button>
                    </div>
                  )}

                  {/* 3. RESUME & MARK COMPLETED (if PAUSED) -> Compact Blue & Green Buttons */}
                  {statusModalTask.status === "PAUSED" && (
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        disabled={updatingStatus}
                        onClick={() => handleApplyStatusFromDialog("IN_PROGRESS")}
                        className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#0070f3] hover:bg-[#0060df] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-60"
                      >
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                        <span>Resume</span>
                      </button>

                      <button
                        type="button"
                        disabled={updatingStatus}
                        onClick={() => handleApplyStatusFromDialog("COMPLETED")}
                        className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-60"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Mark as Completed</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Footer Cancel Button */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setStatusModalTask(null)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Delete Task Confirmation Modal */}
          <ConfirmModal
            isOpen={!!taskToDelete}
            title="Delete Task"
            description={`Are you sure you want to delete "${taskToDelete?.title}"?`}
            confirmText="Delete Task"
            cancelText="Cancel"
            variant="danger"
            loading={deletingTask}
            onConfirm={executeDeleteTask}
            onClose={() => setTaskToDelete(null)}
          />

          {/* Status Action Confirmation Modal (Complete, Pause, Resume, Start) */}
          <ConfirmModal
            isOpen={!!statusConfirm}
            title={statusConfirm?.title || "Confirm Status Change"}
            description={statusConfirm?.description || ""}
            confirmText={statusConfirm?.confirmText || "Confirm"}
            cancelText="Cancel"
            variant={statusConfirm?.variant || "primary"}
            loading={updatingStatus}
            onConfirm={executeStatusChange}
            onClose={() => setStatusConfirm(null)}
          />
        </div>
      </main>
    </div>
  );
}
