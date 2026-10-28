-- AlterEnum
ALTER TYPE "TaskStatus" ADD VALUE IF NOT EXISTS 'PAUSED';

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN "totalDurationSeconds" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "lastStartedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "task_activities" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "fromStatus" "TaskStatus",
    "toStatus" "TaskStatus" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "durationSeconds" INTEGER,
    "note" TEXT,

    CONSTRAINT "task_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "task_activities_taskId_timestamp_idx" ON "task_activities"("taskId", "timestamp");

-- AddForeignKey
ALTER TABLE "task_activities" ADD CONSTRAINT "task_activities_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
