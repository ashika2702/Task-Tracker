import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
    const completedTasks = tasks.filter((t: { status: string }) => t.status === "COMPLETED").length;
    const inProgressTasks = tasks.filter((t: { status: string }) => t.status === "IN_PROGRESS").length;
    const pausedTasks = tasks.filter((t: { status: string }) => t.status === "PAUSED").length;
    const pendingTasks = tasks.filter((t: { status: string }) => t.status === "PENDING").length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const totalActiveSeconds = tasks.reduce(
      (sum: number, t: { totalDurationSeconds: number }) => sum + (t.totalDurationSeconds || 0),
      0
    );
    const totalHours = (totalActiveSeconds / 3600).toFixed(1);

    const projectBreakdown = projects.map((p) => {
      const count = p.tasks.length;
      const completed = p.tasks.filter((t: { status: string }) => t.status === "COMPLETED").length;
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

    return NextResponse.json({
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
      recentCompleted,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json({ error: "Failed to load dashboard metrics" }, { status: 500 });
  }
}
