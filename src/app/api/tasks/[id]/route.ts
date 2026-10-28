import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await Promise.resolve(params);
    const body = await req.json();
    const { status, title, description, projectId, note, mainTitle, subTitle } = body;

    const existingTask = await prisma.task.findUnique({
      where: { id },
    });

    if (!existingTask || existingTask.userId !== session.id) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // RULE 1: If status is COMPLETED, status cannot be changed!
    if (existingTask.status === "COMPLETED" && status !== undefined && status !== "COMPLETED") {
      return NextResponse.json(
        { error: "Completed tasks are locked and their status cannot be changed." },
        { status: 400 }
      );
    }

    const now = new Date();
    const updateData: any = {};
    let activityToCreate: any = null;

    if (mainTitle !== undefined) {
      if (!mainTitle.trim()) {
        return NextResponse.json({ error: "Main title cannot be empty." }, { status: 400 });
      }
      updateData.mainTitle = mainTitle.trim();
    }

    if (subTitle !== undefined) {
      updateData.subTitle = subTitle && subTitle.trim() ? subTitle.trim() : null;
    }

    if (title !== undefined) {
      if (!title.trim()) {
        return NextResponse.json({ error: "Task name cannot be empty." }, { status: 400 });
      }
      updateData.title = title.trim();
    }

    if (description !== undefined) {
      updateData.description = description ? description.trim() : null;
    }

    if (projectId !== undefined) {
      const project = await prisma.project.findUnique({ where: { id: projectId } });
      if (!project || project.userId !== session.id) {
        return NextResponse.json({ error: "Invalid project selected." }, { status: 400 });
      }
      updateData.projectId = projectId;
    }

    // Status transition state machine
    if (status !== undefined && status !== existingTask.status) {
      updateData.status = status;
      const prevStatus = existingTask.status;

      let sessionSeconds = 0;
      if (existingTask.lastStartedAt) {
        const diffMs = now.getTime() - new Date(existingTask.lastStartedAt).getTime();
        sessionSeconds = Math.max(0, Math.floor(diffMs / 1000));
      }

      // 1. START or RESUME (-> IN_PROGRESS)
      if (status === "IN_PROGRESS") {
        updateData.lastStartedAt = now;
        updateData.completedAt = null;

        activityToCreate = {
          taskId: id,
          fromStatus: prevStatus,
          toStatus: "IN_PROGRESS",
          timestamp: now,
          note: prevStatus === "PAUSED" ? (note || "Resumed task") : (note || "Started task"),
        };
      }

      // 2. PAUSE / STOP (IN_PROGRESS -> PAUSED)
      else if (status === "PAUSED") {
        updateData.lastStartedAt = null;
        updateData.completedAt = null;
        if (sessionSeconds > 0) {
          updateData.totalDurationSeconds = existingTask.totalDurationSeconds + sessionSeconds;
        }

        activityToCreate = {
          taskId: id,
          fromStatus: prevStatus,
          toStatus: "PAUSED",
          timestamp: now,
          durationSeconds: sessionSeconds > 0 ? sessionSeconds : null,
          note: note || "Paused task",
        };
      }

      // 3. COMPLETE (-> COMPLETED)
      else if (status === "COMPLETED") {
        updateData.completedAt = now;
        updateData.lastStartedAt = null;
        if (prevStatus === "IN_PROGRESS" && sessionSeconds > 0) {
          updateData.totalDurationSeconds = existingTask.totalDurationSeconds + sessionSeconds;
        }

        activityToCreate = {
          taskId: id,
          fromStatus: prevStatus,
          toStatus: "COMPLETED",
          timestamp: now,
          durationSeconds: prevStatus === "IN_PROGRESS" && sessionSeconds > 0 ? sessionSeconds : null,
          note: note || "Completed task",
        };
      }
    }

    // Execute update and log activity in a transaction
    const [updatedTask] = await prisma.$transaction([
      prisma.task.update({
        where: { id },
        data: updateData,
        include: {
          project: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      }),
      ...(activityToCreate ? [prisma.taskActivity.create({ data: activityToCreate })] : []),
    ]);

    return NextResponse.json({ task: updatedTask });
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await Promise.resolve(params);

    const existingTask = await prisma.task.findUnique({
      where: { id },
    });

    if (!existingTask || existingTask.userId !== session.id) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // RULE 2: If the task has already been started, it cannot be deleted!
    if (existingTask.status !== "PENDING") {
      return NextResponse.json(
        { error: "Tasks that have already been started cannot be deleted to preserve history." },
        { status: 400 }
      );
    }

    await prisma.task.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
