import { Suspense } from "react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TimeReportsClient from "@/components/TimeReportsClient";
import { ReportsPageSkeleton } from "@/components/SkeletonLoaders";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  // Pre-fetch projects and report tasks on server in parallel with zero HTTP latency
  const [projects, tasks] = await Promise.all([
    prisma.project.findMany({
      where: { userId: session.id },
      select: { id: true, name: true, code: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.task.findMany({
      where: { userId: session.id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        activities: {
          orderBy: { timestamp: "asc" },
          select: {
            id: true,
            fromStatus: true,
            toStatus: true,
            timestamp: true,
            durationSeconds: true,
            note: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const now = new Date();
  let projectTotalDurationSeconds = 0;
  let completedCount = 0;
  let inProgressCount = 0;
  let pausedCount = 0;
  let pendingCount = 0;

  const enrichedTasks = tasks.map((task) => {
    let currentSessionSeconds = 0;
    if (task.status === "IN_PROGRESS" && task.lastStartedAt) {
      const diffMs = now.getTime() - new Date(task.lastStartedAt).getTime();
      currentSessionSeconds = Math.max(0, Math.floor(diffMs / 1000));
    }
    const effectiveDurationSeconds = (task.totalDurationSeconds || 0) + currentSessionSeconds;

    return {
      id: task.id,
      mainTitle: task.mainTitle || "",
      subTitle: task.subTitle || null,
      title: task.title,
      description: task.description || null,
      status: task.status as "PENDING" | "IN_PROGRESS" | "PAUSED" | "COMPLETED",
      totalDurationSeconds: task.totalDurationSeconds || 0,
      effectiveDurationSeconds,
      lastStartedAt: task.lastStartedAt ? task.lastStartedAt.toISOString() : null,
      completedAt: task.completedAt ? task.completedAt.toISOString() : null,
      createdAt: task.createdAt.toISOString(),
      project: {
        id: task.project.id,
        name: task.project.name,
        code: task.project.code,
      },
      activities: task.activities.map((a) => ({
        id: a.id,
        fromStatus: a.fromStatus as any,
        toStatus: a.toStatus as any,
        timestamp: a.timestamp.toISOString(),
        durationSeconds: a.durationSeconds,
        note: a.note,
      })),
    };
  });

  const mainTitleMap = new Map<string, {
    mainTitle: string;
    totalDurationSeconds: number;
    tasks: typeof enrichedTasks;
  }>();

  for (const task of enrichedTasks) {
    projectTotalDurationSeconds += task.effectiveDurationSeconds;

    if (task.status === "COMPLETED") completedCount++;
    else if (task.status === "IN_PROGRESS") inProgressCount++;
    else if (task.status === "PAUSED") pausedCount++;
    else if (task.status === "PENDING") pendingCount++;

    const main = task.mainTitle || "General";
    if (!mainTitleMap.has(main)) {
      mainTitleMap.set(main, {
        mainTitle: main,
        totalDurationSeconds: 0,
        tasks: [],
      });
    }

    const group = mainTitleMap.get(main)!;
    group.totalDurationSeconds += task.effectiveDurationSeconds;
    group.tasks.push(task);
  }

  const mainTitleGroups = Array.from(mainTitleMap.values()).map((group) => {
    const subTitleMap = new Map<string, {
      subTitle: string;
      totalDurationSeconds: number;
      tasks: typeof group.tasks;
    }>();

    let mainCompleted = 0;

    for (const t of group.tasks) {
      if (t.status === "COMPLETED") mainCompleted++;

      const sub = t.subTitle && t.subTitle.trim() ? t.subTitle.trim() : "Default";
      if (!subTitleMap.has(sub)) {
        subTitleMap.set(sub, {
          subTitle: sub,
          totalDurationSeconds: 0,
          tasks: [],
        });
      }
      const subGroup = subTitleMap.get(sub)!;
      subGroup.totalDurationSeconds += t.effectiveDurationSeconds;
      subGroup.tasks.push(t);
    }

    const subTitles = Array.from(subTitleMap.values()).sort((a, b) => {
      if (a.subTitle === "Default") return 1;
      if (b.subTitle === "Default") return -1;
      return a.subTitle.localeCompare(b.subTitle);
    });

    return {
      mainTitle: group.mainTitle,
      totalDurationSeconds: group.totalDurationSeconds,
      totalTasks: group.tasks.length,
      completedTasks: mainCompleted,
      progressPercent: group.tasks.length > 0 ? Math.round((mainCompleted / group.tasks.length) * 100) : 0,
      subTitles,
    };
  }).sort((a, b) => b.totalDurationSeconds - a.totalDurationSeconds);

  const initialReportData = {
    project: null,
    stats: {
      totalDurationSeconds: projectTotalDurationSeconds,
      totalTasks: tasks.length,
      completedTasks: completedCount,
      inProgressTasks: inProgressCount,
      pausedTasks: pausedCount,
      pendingTasks: pendingCount,
      progressPercent: tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0,
    },
    mainTitleGroups,
  };

  return (
    <Suspense fallback={<ReportsPageSkeleton count={3} />}>
      <TimeReportsClient
        user={session}
        initialProjects={projects}
        initialReportData={initialReportData}
      />
    </Suspense>
  );
}
