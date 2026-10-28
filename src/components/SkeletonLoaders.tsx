"use client";

import React from "react";
import Sidebar from "@/components/Sidebar";

/**
 * Fast Shimmering Skeleton Loaders
 * Designed to eliminate layout shift, provide instantaneous feedback (<16ms),
 * and keep the UI clean with smooth shimmering transitions.
 */

export function PageShellSkeleton({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col lg:flex-row">
      {/* Real Sidebar - NEVER a skeleton */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 lg:pl-64 min-w-0 flex flex-col min-h-screen">
        {/* Header Bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200/80 px-6 sm:px-8 lg:px-10 h-14 flex items-center justify-between">
          <h1 className="text-base font-bold text-slate-900 tracking-tight">{title}</h1>
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200" />
        </header>

        {/* Page Body */}
        <div className="w-full px-6 sm:px-8 lg:px-10 py-6 space-y-6 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}

export function TaskRowSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <tr key={rIdx} className="py-3.5">
          {/* Task name & breadcrumb */}
          <td className="py-3.5 px-4 w-[190px] min-w-[170px]">
            <div className="space-y-1.5">
              <div className="h-3 w-16 skeleton-shimmer rounded" />
              <div className="h-3.5 w-32 skeleton-shimmer rounded" />
            </div>
          </td>

          {/* Project */}
          <td className="py-3.5 px-4 w-[160px] min-w-[140px]">
            <div className="h-6 w-24 skeleton-shimmer rounded-lg" />
          </td>

          {/* Status */}
          <td className="py-3.5 px-4 w-[130px] min-w-[120px]">
            <div className="h-6 w-20 skeleton-shimmer rounded-full" />
          </td>

          {/* Active work time */}
          <td className="py-3.5 px-4 w-[140px] min-w-[130px]">
            <div className="h-4 w-14 skeleton-shimmer rounded" />
          </td>

          {/* Created Date */}
          <td className="py-3.5 px-4 w-[160px] min-w-[150px]">
            <div className="h-3.5 w-24 skeleton-shimmer rounded" />
          </td>

          {/* Completed Date */}
          <td className="py-3.5 px-4 w-[160px] min-w-[150px]">
            <div className="h-3.5 w-20 skeleton-shimmer rounded" />
          </td>

          {/* Actions */}
          <td className="py-3.5 px-4 text-right w-[120px] min-w-[110px]">
            <div className="flex items-center justify-end gap-1.5">
              <div className="w-7 h-7 skeleton-shimmer rounded-lg" />
              <div className="w-7 h-7 skeleton-shimmer rounded-lg" />
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}

export function TasksPageSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      {/* Filter Bar Placeholder matching Tasks layout */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-44 skeleton-shimmer rounded-xl" />
          <div className="h-8 w-40 skeleton-shimmer rounded-xl" />
        </div>
        <div className="flex items-center gap-3 justify-between md:justify-end">
          <div className="h-8 w-56 skeleton-shimmer rounded-xl" />
          <div className="h-8 w-48 skeleton-shimmer rounded-xl" />
        </div>
      </div>

      {/* Table Shell with exact column widths */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="h-4 w-28 skeleton-shimmer rounded" />
          <div className="h-7 w-24 skeleton-shimmer rounded-xl" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs min-w-[960px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 uppercase tracking-wider font-semibold text-[11px] whitespace-nowrap">
                <th className="py-3 px-4 w-[190px] min-w-[170px]">Task Name</th>
                <th className="py-3 px-4 w-[160px] min-w-[140px]">Project</th>
                <th className="py-3 px-4 w-[130px] min-w-[120px]">Status</th>
                <th className="py-3 px-4 w-[140px] min-w-[130px]">Active Work Time</th>
                <th className="py-3 px-4 w-[160px] min-w-[150px]">Created Date</th>
                <th className="py-3 px-4 w-[160px] min-w-[150px]">Completed Date</th>
                <th className="py-3 px-4 text-right w-[120px] min-w-[110px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <TaskRowSkeleton rows={rows} />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function AccordionSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-white border border-slate-200/90 rounded-2xl shadow-sm p-5 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-lg skeleton-shimmer" />
            <div className="space-y-1.5">
              <div className="h-4 w-36 skeleton-shimmer rounded" />
              <div className="h-3 w-20 skeleton-shimmer rounded" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-4 w-20 skeleton-shimmer rounded" />
            <div className="h-6 w-16 skeleton-shimmer rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ReportsPageSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      <div className="h-4 w-52 skeleton-shimmer rounded mb-2" />
      <AccordionSkeleton count={count} />
    </div>
  );
}

export function DashboardMetricsSkeleton() {
  return (
    <div className="space-y-6">
      {/* 6 Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div
            key={idx}
            className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-16 skeleton-shimmer rounded" />
              <div className="w-4 h-4 rounded skeleton-shimmer" />
            </div>
            <div>
              <div className="h-7 w-12 skeleton-shimmer rounded mb-1.5" />
              <div className="h-2.5 w-16 skeleton-shimmer rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* 2 Big cards below: Project Progress + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Progress Overview */}
        <div className="lg:col-span-2 bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-5 w-48 skeleton-shimmer rounded" />
            <div className="h-4 w-20 skeleton-shimmer rounded" />
          </div>
          <div className="space-y-4 pt-2">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-12 skeleton-shimmer rounded" />
                    <div className="h-4 w-32 skeleton-shimmer rounded" />
                  </div>
                  <div className="h-3.5 w-16 skeleton-shimmer rounded" />
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full w-2/3 skeleton-shimmer rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Completed Activity */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-5 w-36 skeleton-shimmer rounded" />
            <div className="h-4 w-16 skeleton-shimmer rounded" />
          </div>
          <div className="space-y-3 pt-2 divide-y divide-slate-100">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="pt-3 first:pt-0 flex items-center justify-between">
                <div className="space-y-1.5">
                  <div className="h-3.5 w-28 skeleton-shimmer rounded" />
                  <div className="h-2.5 w-16 skeleton-shimmer rounded" />
                </div>
                <div className="h-3 w-16 skeleton-shimmer rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProjectsTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      {/* Top Bar with Project count placeholder */}
      <div className="flex items-center justify-between gap-4">
        <div className="h-4 w-28 skeleton-shimmer rounded" />
      </div>

      {/* Projects Table Shell */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs min-w-[880px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 uppercase tracking-wider font-semibold text-[11px] whitespace-nowrap">
                <th className="py-3 px-4 w-[110px] min-w-[95px]">Code</th>
                <th className="py-3 px-4 w-[200px] min-w-[170px]">Project Name</th>
                <th className="py-3 px-4 w-[140px] min-w-[130px]">Tasks</th>
                <th className="py-3 px-4 w-[160px] min-w-[150px]">Progress</th>
                <th className="py-3 px-4 w-[160px] min-w-[150px]">Created Date</th>
                <th className="py-3 px-4 text-right w-[120px] min-w-[110px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Array.from({ length: rows }).map((_, idx) => (
                <tr key={idx} className="py-3.5">
                  <td className="py-3.5 px-4 w-[110px] min-w-[95px]">
                    <div className="h-6 w-14 skeleton-shimmer rounded-md" />
                  </td>
                  <td className="py-3.5 px-4 w-[200px] min-w-[170px]">
                    <div className="space-y-1.5">
                      <div className="h-4 w-32 skeleton-shimmer rounded" />
                      <div className="h-3 w-40 skeleton-shimmer rounded" />
                    </div>
                  </td>
                  <td className="py-3.5 px-4 w-[140px] min-w-[130px]">
                    <div className="h-6 w-20 skeleton-shimmer rounded-lg" />
                  </td>
                  <td className="py-3.5 px-4 w-[160px] min-w-[150px]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-20 bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div className="h-full w-3/4 skeleton-shimmer rounded-full" />
                      </div>
                      <div className="h-3 w-8 skeleton-shimmer rounded" />
                    </div>
                  </td>
                  <td className="py-3.5 px-4 w-[160px] min-w-[150px]">
                    <div className="h-3.5 w-24 skeleton-shimmer rounded" />
                  </td>
                  <td className="py-3.5 px-4 text-right w-[120px] min-w-[110px]">
                    <div className="flex items-center justify-end gap-1.5">
                      <div className="w-7 h-7 skeleton-shimmer rounded-lg" />
                      <div className="w-7 h-7 skeleton-shimmer rounded-lg" />
                      <div className="w-7 h-7 skeleton-shimmer rounded-lg" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function AttendanceSkeleton() {
  return (
    <div className="space-y-4">
      {/* Top Filter Bar & Tab Placeholder */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-28 skeleton-shimmer rounded-xl" />
          <div className="h-8 w-20 skeleton-shimmer rounded-xl" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-7 w-24 skeleton-shimmer rounded-xl" />
          <div className="h-7 w-24 skeleton-shimmer rounded-xl" />
          <div className="h-7 w-24 skeleton-shimmer rounded-xl" />
        </div>
        <div className="h-8 w-40 skeleton-shimmer rounded-xl" />
      </div>

      {/* Main Grid Placeholder with compact cells */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-5">
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-4 skeleton-shimmer rounded" />
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="h-[78px] sm:h-[88px] skeleton-shimmer rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
