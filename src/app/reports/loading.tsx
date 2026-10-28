import { PageShellSkeleton, ReportsPageSkeleton } from "@/components/SkeletonLoaders";

export default function ReportsLoading() {
  return (
    <PageShellSkeleton title="Time Reports">
      <ReportsPageSkeleton count={3} />
    </PageShellSkeleton>
  );
}
