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
    const { name, code, description } = await req.json();

    const existing = await prisma.project.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== session.id) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const updateData: {
      name?: string;
      code?: string | null;
      description?: string | null;
    } = {};

    if (name !== undefined) {
      if (!name.trim()) {
        return NextResponse.json({ error: "Project name cannot be empty." }, { status: 400 });
      }
      updateData.name = name.trim();
    }
    if (code !== undefined) updateData.code = code ? code.trim().toUpperCase() : null;
    if (description !== undefined) updateData.description = description ? description.trim() : null;

    const project = await prisma.project.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ project });
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
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

    const existing = await prisma.project.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== session.id) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    await prisma.project.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
  }
}
