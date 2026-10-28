import { Suspense } from "react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TasksClient from "@/components/TasksClient";

import { TasksPageSkeleton } from "@/components/SkeletonLoaders";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  // Pre-fetch projects and tasks on server in parallel with zero HTTP latency
  const [projects, tasks] = await Promise.all([
    prisma.project.findMany({
      where: { userId: session.id },
      select: {
        id: true,
        name: true,
        code: true,
      },
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
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const formattedTasks = tasks.map((t) => ({
    id: t.id,
    mainTitle: t.mainTitle || "",
    subTitle: t.subTitle || null,
    title: t.title,
    description: t.description || null,
    status: t.status as "PENDING" | "IN_PROGRESS" | "PAUSED" | "COMPLETED",
    totalDurationSeconds: t.totalDurationSeconds || 0,
    lastStartedAt: t.lastStartedAt ? t.lastStartedAt.toISOString() : null,
    completedAt: t.completedAt ? t.completedAt.toISOString() : null,
    createdAt: t.createdAt.toISOString(),
    project: {
      id: t.project.id,
      name: t.project.name,
      code: t.project.code,
    },
  }));

  return (
    <Suspense fallback={<TasksPageSkeleton rows={6} />}>
      <TasksClient
        user={session}
        initialProjects={projects}
        initialTasks={formattedTasks}
      />
    </Suspense>
  );
}
