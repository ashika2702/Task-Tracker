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

    const tasks = await prisma.task.findMany({
      where: whereClause,
      select: {
        mainTitle: true,
        subTitle: true,
      },
      distinct: ["mainTitle", "subTitle"],
    });

    // Group subtitles by mainTitle
    const hierarchyMap = new Map<string, Set<string>>();

    for (const t of tasks) {
      const main = t.mainTitle || "General";
      if (!hierarchyMap.has(main)) {
        hierarchyMap.set(main, new Set<string>());
      }
      if (t.subTitle && t.subTitle.trim()) {
        hierarchyMap.get(main)!.add(t.subTitle.trim());
      }
    }

    const hierarchy = Array.from(hierarchyMap.entries()).map(([mainTitle, subSet]) => ({
      mainTitle,
      subTitles: Array.from(subSet).sort(),
    })).sort((a, b) => a.mainTitle.localeCompare(b.mainTitle));

    return NextResponse.json({ hierarchy });
  } catch (error) {
    console.error("Error fetching task titles hierarchy:", error);
    return NextResponse.json({ error: "Failed to load titles" }, { status: 500 });
  }
}
