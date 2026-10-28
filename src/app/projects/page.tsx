import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProjectsClient from "@/components/ProjectsClient";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  // Pre-fetch projects on the server in parallel with zero HTTP latency
  const projects = await prisma.project.findMany({
    where: { userId: session.id },
    include: {
      tasks: {
        select: {
          id: true,
          status: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const formattedProjects = projects.map((p) => {
    const totalTasks = p.tasks.length;
    const completedTasks = p.tasks.filter((t) => t.status === "COMPLETED").length;
    const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      id: p.id,
      name: p.name,
      code: p.code,
      description: p.description,
      createdAt: p.createdAt.toISOString(),
      totalTasks,
      completedTasks,
      progressPercent,
    };
  });

  return <ProjectsClient user={session} initialProjects={formattedProjects} />;
}
