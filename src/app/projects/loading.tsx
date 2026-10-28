import { PageShellSkeleton, ProjectsTableSkeleton } from "@/components/SkeletonLoaders";

export default function ProjectsLoading() {
  return (
    <PageShellSkeleton title="Projects">
      <ProjectsTableSkeleton rows={5} />
    </PageShellSkeleton>
  );
}
