import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DashboardOverviewClient from "@/components/DashboardOverviewClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  // Pre-fetch all dashboard stats on the server in parallel with zero HTTP latency
  const [projects, tasks, recentCompleted] = await Promise.all([
    prisma.project.findMany({
      where: { userId: session.id },
      include: {
        tasks: {
          select: { status: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.task.findMany({
      where: { userId: session.id },
      select: { status: true, totalDurationSeconds: true },
    }),
    prisma.task.findMany({
      where: {
        userId: session.id,
        status: "COMPLETED",
      },
      include: {
        project: {
          select: { name: true, code: true },
        },
      },
      orderBy: { completedAt: "desc" },
      take: 5,
    }),
  ]);

  const totalProjects = projects.length;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "COMPLETED").length;
  const inProgressTasks = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const pausedTasks = tasks.filter((t) => t.status === "PAUSED").length;
  const pendingTasks = tasks.filter((t) => t.status === "PENDING").length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const totalActiveSeconds = tasks.reduce(
    (sum, t) => sum + (t.totalDurationSeconds || 0),
    0
  );
  const totalHours = (totalActiveSeconds / 3600).toFixed(1);

  const projectBreakdown = projects.map((p) => {
    const count = p.tasks.length;
    const completed = p.tasks.filter((t) => t.status === "COMPLETED").length;
    const percent = count > 0 ? Math.round((completed / count) * 100) : 0;
    return {
      id: p.id,
      name: p.name,
      code: p.code,
      total: count,
      completed,
      percent,
    };
  });

  const formattedRecent = recentCompleted.map((t) => ({
    id: t.id,
    title: t.title,
    completedAt: t.completedAt ? t.completedAt.toISOString() : null,
    project: {
      name: t.project.name,
      code: t.project.code,
    },
  }));

  const initialData = {
    stats: {
      totalProjects,
      totalTasks,
      completedTasks,
      inProgressTasks,
      pausedTasks,
      pendingTasks,
      completionRate,
      totalHours,
    },
    projectBreakdown,
    recentCompleted: formattedRecent,
  };

  return <DashboardOverviewClient user={session} initialData={initialData} />;
}
