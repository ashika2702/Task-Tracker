import { PageShellSkeleton, TasksPageSkeleton } from "@/components/SkeletonLoaders";

export default function TasksLoading() {
  return (
    <PageShellSkeleton title="Tasks">
      <TasksPageSkeleton rows={6} />
    </PageShellSkeleton>
  );
}
