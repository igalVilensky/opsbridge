-- CreateTable
CREATE TABLE "CallSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caseId" TEXT NOT NULL,
    "externalCallId" TEXT NOT NULL,
    "calledAt" DATETIME NOT NULL,
    "durationSeconds" INTEGER NOT NULL,
    "callStatus" TEXT NOT NULL,
    "note" TEXT,
    "rawData" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CallSnapshot_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "CallSnapshot_caseId_key" ON "CallSnapshot"("caseId");
