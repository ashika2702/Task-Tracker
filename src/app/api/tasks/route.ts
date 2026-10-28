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
    const status = searchParams.get("status");
    const mainTitle = searchParams.get("mainTitle");
    const search = searchParams.get("search");

    const whereClause: any = {
      userId: session.id,
    };

    if (projectId && projectId !== "ALL") {
      whereClause.projectId = projectId;
    }

    if (status && status !== "ALL") {
      whereClause.status = status;
    }

    if (mainTitle && mainTitle !== "ALL") {
      whereClause.mainTitle = mainTitle;
    }

    if (search && search.trim()) {
      whereClause.OR = [
        { title: { contains: search.trim(), mode: "insensitive" } },
        { mainTitle: { contains: search.trim(), mode: "insensitive" } },
        { subTitle: { contains: search.trim(), mode: "insensitive" } },
      ];
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json({ error: "Failed to load tasks" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, mainTitle, subTitle, projectId, status, description } = await req.json();

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Task name is mandatory." }, { status: 400 });
    }

    if (!projectId) {
      return NextResponse.json({ error: "Project selection is mandatory." }, { status: 400 });
    }

    const sanitizedMainTitle = mainTitle && mainTitle.trim() ? mainTitle.trim() : "General";

    const taskStatus = status || "PENDING";
    if (!["PENDING", "IN_PROGRESS", "PAUSED", "COMPLETED"].includes(taskStatus)) {
      return NextResponse.json({ error: "Valid status is mandatory." }, { status: 400 });
    }

    // Verify project belongs to user
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.userId !== session.id) {
      return NextResponse.json({ error: "Invalid project selected." }, { status: 400 });
    }

    const now = new Date();
    const lastStartedAt = taskStatus === "IN_PROGRESS" ? now : null;
    const completedAt = taskStatus === "COMPLETED" ? now : null;

    const task = await prisma.task.create({
      data: {
        userId: session.id,
        projectId,
        mainTitle: sanitizedMainTitle,
        subTitle: subTitle && subTitle.trim() ? subTitle.trim() : null,
        title: title.trim(),
        status: taskStatus,
        description: description ? description.trim() : null,
        lastStartedAt,
        completedAt,
        activities: {
          create: {
            toStatus: taskStatus,
            timestamp: now,
            note: "Task created",
          },
        },
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
