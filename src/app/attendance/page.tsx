import { Suspense } from "react";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AttendanceClient, { AttendanceRecord } from "@/components/AttendanceClient";
import { PageShellSkeleton, AttendanceSkeleton } from "@/components/SkeletonLoaders";

export const dynamic = "force-dynamic";

export default async function AttendancePage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // Calculate start and end dates for the current month
  const startDate = new Date(Date.UTC(currentYear, currentMonth - 1, 1));
  const endDate = new Date(Date.UTC(currentYear, currentMonth, 0, 23, 59, 59, 999));

  // Server-side prefetch for zero-flicker instant loading
  const rawRecords = await prisma.attendanceRecord.findMany({
    where: {
      userId: session.id,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { date: "asc" },
  });

  let wfhCount = 0;
  let leaveCount = 0;
  let halfDayCount = 0;

  const records: AttendanceRecord[] = rawRecords.map((r) => {
    if (r.type === "WFH") wfhCount++;
    else if (r.type === "LEAVE") leaveCount++;
    else if (r.type === "HALF_DAY") halfDayCount++;

    return {
      id: r.id,
      userId: r.userId,
      date: r.date.toISOString(),
      type: r.type,
      note: r.note,
      createdAt: r.createdAt.toISOString(),
    };
  });

  const stats = {
    wfhCount,
    leaveCount,
    halfDayCount,
    totalLogged: records.length,
  };

  return (
    <Suspense
      fallback={
        <PageShellSkeleton title="Attendance & Leaves">
          <AttendanceSkeleton />
        </PageShellSkeleton>
      }
    >
      <AttendanceClient
        user={{
          name: session.name,
          username: session.username,
          email: session.email,
        }}
        initialRecords={records}
        initialStats={stats}
        initialMonth={currentMonth}
        initialYear={currentYear}
      />
    </Suspense>
  );
}
