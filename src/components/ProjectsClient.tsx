"use client";

import { useState, useEffect, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import AdminHeader from "@/components/AdminHeader";
import ConfirmModal from "@/components/ConfirmModal";
import toast from "react-hot-toast";
import Link from "next/link";
import { Plus, FolderKanban, ArrowRight, Trash2, Edit3, Loader2, X, CheckCircle2 } from "lucide-react";
import { ProjectsTableSkeleton } from "@/components/SkeletonLoaders";

interface Project {
  id: string;
  name: string;
  code: string | null;
  description: string | null;
  totalTasks: number;
  completedTasks: number;
  progressPercent: number;
  createdAt: string;
}

interface ProjectsClientProps {
  user: {
    name: string;
    username: string;
    email: string;
  };
  initialProjects?: Project[];
}

export default function ProjectsClient({ user, initialProjects }: ProjectsClientProps) {
  const [projects, setProjects] = useState<Project[]>(initialProjects || []);
  const [loading, setLoading] = useState(!initialProjects);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

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

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
  });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchProjects = useCallback(async () => {
    if (!initialProjects) setLoading(true);
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      }
    } catch (err) {
      console.error("Failed to load projects:", err);
    } finally {
      setLoading(false);
    }
  }, [initialProjects]);

  useEffect(() => {
    if (!initialProjects) {
      fetchProjects();
    }
  }, [fetchProjects, initialProjects]);

  const openCreateModal = () => {
    setEditingProject(null);
    setFormData({ name: "", code: "", description: "" });
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (project: Project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      code: project.code || "",
      description: project.description || "",
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError("Project Name is mandatory.");
      return;
    }

    setSubmitting(true);
    setFormError("");

    try {
      if (editingProject) {
        const res = await fetch(`/api/projects/${editingProject.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to update project");
        }
      } else {
        const res = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to create project");
        }
      }

      setIsModalOpen(false);
      fetchProjects();
    } catch (err: any) {
      setFormError(err.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  const [projectToDelete, setProjectToDelete] = useState<{ id: string; name: string } | null>(null);
  const [deletingProject, setDeletingProject] = useState(false);

  const handleDelete = (id: string, name: string) => {
    setProjectToDelete({ id, name });
  };

  const executeDeleteProject = async () => {
    if (!projectToDelete) return;
    setDeletingProject(true);
    try {
      const res = await fetch(`/api/projects/${projectToDelete.id}`, { method: "DELETE" });
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== projectToDelete.id));
        toast.success(`Project "${projectToDelete.name}" deleted successfully.`);
        setProjectToDelete(null);
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete project");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete project");
    } finally {
      setDeletingProject(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col lg:flex-row">
      <Sidebar user={user} />

      <main className="flex-1 lg:pl-64 min-w-0 flex flex-col min-h-screen">
        <AdminHeader user={user} title="Projects">
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0070f3] hover:bg-[#0060df] text-white text-xs font-semibold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Project</span>
          </button>
        </AdminHeader>

        <div className="w-full px-6 sm:px-8 lg:px-10 py-6 space-y-6 flex-1">
          {/* Top Bar with Project count */}
          {!loading && projects.length > 0 && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs font-semibold text-slate-600">
                All Projects ({projects.length})
              </span>
            </div>
          )}

          {/* Projects Content */}
          {loading ? (
            <ProjectsTableSkeleton rows={5} />
          ) : projects.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-3xl py-16 px-4 text-center max-w-lg mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto text-[#0070f3] mb-3">
                <FolderKanban className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">No projects yet</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Create your first project to start assigning and managing tasks effectively.
              </p>
              <button
                onClick={openCreateModal}
                className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0070f3] hover:bg-[#0060df] text-white text-xs font-semibold transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>New Project</span>
              </button>
            </div>
          ) : (
            /* Table View with reduced, neat Project Name cell width */
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs min-w-[880px]">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 uppercase tracking-wider font-semibold text-[11px] whitespace-nowrap">
                      <th className="py-3 px-4 w-[110px] min-w-[95px]">Code</th>
                      <th className="py-3 px-4 w-[200px] min-w-[170px]">Project Name</th>
                      <th className="py-3 px-4 w-[140px] min-w-[130px]">Tasks</th>
                      <th className="py-3 px-4 w-[160px] min-w-[150px]">Progress</th>
                      <th className="py-3 px-4 w-[160px] min-w-[150px]">Created Date</th>
                      <th className="py-3 px-4 text-right w-[120px] min-w-[110px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {projects.map((project) => (
                      <tr
                        key={project.id}
                        className="hover:bg-blue-50/40 transition-colors group"
                      >
                        {/* Project Code */}
                        <td className="py-3.5 px-4 whitespace-nowrap w-[110px] min-w-[95px]">
                          {project.code ? (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-[#0070f3] border border-blue-100 uppercase tracking-wider">
                              {project.code}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">—</span>
                          )}
                        </td>

                        {/* Project Name & Description - Reduced width with clean truncation */}
                        <td className="py-3.5 px-4 font-medium text-slate-900 w-[200px] min-w-[170px] whitespace-nowrap">
                          <div className="flex flex-col">
                            <span
                              className="text-slate-900 font-semibold group-hover:text-[#0070f3] transition-colors truncate block max-w-[190px]"
                              title={project.name}
                            >
                              {project.name}
                            </span>
                            {project.description && (
                              <span
                                className="text-[11px] text-slate-400 font-normal truncate block max-w-[190px] mt-0.5"
                                title={project.description}
                              >
                                {project.description}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Tasks (Completed of Total) */}
                        <td className="py-3.5 px-4 whitespace-nowrap w-[140px] min-w-[130px]">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium">
                            <span className="font-semibold text-slate-900">{project.completedTasks}</span>
                            <span className="text-slate-400">/</span>
                            <span>{project.totalTasks} done</span>
                          </span>
                        </td>

                        {/* Progress Bar & Percent */}
                        <td className="py-3.5 px-4 whitespace-nowrap w-[160px] min-w-[150px]">
                          <div className="flex items-center gap-2.5">
                            <div className="w-20 bg-slate-100 rounded-full h-2 overflow-hidden flex-shrink-0">
                              <div
                                className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${project.progressPercent}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold text-slate-700 min-w-[36px]">
                              {project.progressPercent}%
                            </span>
                          </div>
                        </td>

                        {/* Created Date */}
                        <td suppressHydrationWarning className="py-3.5 px-4 whitespace-nowrap text-slate-500 w-[160px] min-w-[150px]">
                          {formatDateTime(project.createdAt)}
                        </td>

                        {/* Actions: View Tasks, Edit, Delete */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-right w-[120px] min-w-[110px]">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              href={`/tasks?projectId=${project.id}`}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-[#0070f3] hover:bg-blue-50 transition-colors"
                              title="View Tasks"
                            >
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                            <button
                              onClick={() => openEditModal(project)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                              title="Edit project"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(project.id, project.name)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Delete project"
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
            </div>
          )}

        {/* Create / Edit Project Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-[#0070f3]">
                    <FolderKanban className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {editingProject ? "Edit Project" : "Create New Project"}
                  </h3>
                </div>
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
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Project Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Website Redesign"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0070f3]/20 focus:border-[#0070f3]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Project Code <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g. WEB-01"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0070f3]/20 focus:border-[#0070f3]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Description <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of the project goals..."
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
                        <span>{editingProject ? "Save Changes" : "Create Project"}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Project Confirmation Modal */}
        <ConfirmModal
          isOpen={!!projectToDelete}
          title="Delete Project"
          description={`Are you sure you want to delete "${projectToDelete?.name}"?`}
          confirmText="Delete Project"
          cancelText="Cancel"
          variant="danger"
          loading={deletingProject}
          onConfirm={executeDeleteProject}
          onClose={() => setProjectToDelete(null)}
        />
        </div>
      </main>
    </div>
  );
}
