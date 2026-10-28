import { PageShellSkeleton, AttendanceSkeleton } from "@/components/SkeletonLoaders";

export default function AttendanceLoading() {
  return (
    <PageShellSkeleton title="Attendance & Leaves">
      <AttendanceSkeleton />
    </PageShellSkeleton>
  );
}
