import { PageShellSkeleton, DashboardMetricsSkeleton } from "@/components/SkeletonLoaders";

export default function DashboardLoading() {
  return (
    <PageShellSkeleton title="Dashboard">
      <DashboardMetricsSkeleton />
    </PageShellSkeleton>
  );
}
