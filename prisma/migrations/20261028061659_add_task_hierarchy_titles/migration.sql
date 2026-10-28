-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "mainTitle" TEXT NOT NULL DEFAULT 'General',
ADD COLUMN     "subTitle" TEXT;

-- CreateIndex
CREATE INDEX "tasks_projectId_mainTitle_idx" ON "tasks"("projectId", "mainTitle");
