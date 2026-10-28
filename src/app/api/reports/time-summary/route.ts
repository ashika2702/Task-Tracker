import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    const whereClause: any = {
      userId: session.id,
    };

    if (projectId && projectId !== "ALL") {
      whereClause.projectId = projectId;
    }

    // Fetch project details and tasks in parallel
    const [selectedProject, tasks] = await Promise.all([
      projectId && projectId !== "ALL"
        ? prisma.project.findUnique({
            where: { id: projectId },
            select: { id: true, name: true, code: true },
          })
        : Promise.resolve(null),
      prisma.task.findMany({
        where: whereClause,
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
        orderBy: {
          createdAt: "desc",
        },
      }),
    ]);

    const now = new Date();
    let projectTotalDurationSeconds = 0;
    let completedCount = 0;
    let inProgressCount = 0;
    let pausedCount = 0;
    let pendingCount = 0;

    // Enrich tasks with currently active elapsed time
    const enrichedTasks = tasks.map((task) => {
      let currentSessionSeconds = 0;
      if (task.status === "IN_PROGRESS" && task.lastStartedAt) {
        const diffMs = now.getTime() - new Date(task.lastStartedAt).getTime();
        currentSessionSeconds = Math.max(0, Math.floor(diffMs / 1000));
      }
      const effectiveDurationSeconds = (task.totalDurationSeconds || 0) + currentSessionSeconds;

      return {
        ...task,
        effectiveDurationSeconds,
      };
    });

    // Map: mainTitle -> { totalDurationSeconds, tasks: EnrichedTask[] }
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

    // Build hierarchical structure for each main title
    const mainTitleGroups = Array.from(mainTitleMap.values()).map((group) => {
      // Group tasks inside mainTitle by subTitle
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

    return NextResponse.json({
      project: selectedProject,
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
    });
  } catch (error) {
    console.error("Error generating time summary report:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
