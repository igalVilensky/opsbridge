-- CreateTable
CREATE TABLE "EnrichmentRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caseId" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EnrichmentRun_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_IntegrationRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caseId" TEXT NOT NULL,
    "enrichmentRunId" TEXT,
    "integrationName" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "errorMessage" TEXT,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" DATETIME,
    CONSTRAINT "IntegrationRun_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "IntegrationRun_enrichmentRunId_fkey" FOREIGN KEY ("enrichmentRunId") REFERENCES "EnrichmentRun" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_IntegrationRun" ("caseId", "errorMessage", "finishedAt", "id", "integrationName", "startedAt", "status") SELECT "caseId", "errorMessage", "finishedAt", "id", "integrationName", "startedAt", "status" FROM "IntegrationRun";
DROP TABLE "IntegrationRun";
ALTER TABLE "new_IntegrationRun" RENAME TO "IntegrationRun";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "EnrichmentRun_caseId_idx" ON "EnrichmentRun"("caseId");

-- CreateIndex
CREATE INDEX "IntegrationRun_caseId_idx" ON "IntegrationRun"("caseId");

-- CreateIndex
CREATE INDEX "IntegrationRun_enrichmentRunId_idx" ON "IntegrationRun"("enrichmentRunId");

-- CreateIndex
CREATE INDEX "IntegrationRun_integrationName_idx" ON "IntegrationRun"("integrationName");

-- CreateIndex
CREATE INDEX "IntegrationRun_status_idx" ON "IntegrationRun"("status");
