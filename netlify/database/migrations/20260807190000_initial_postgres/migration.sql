-- CreateTable
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Case" (
    "id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "originalMessage" TEXT NOT NULL,
    "customerEmail" TEXT,
    "orderId" TEXT,
    "phoneNumber" TEXT,
    "department" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "externalRequestId" TEXT,
    "aiSummary" TEXT,
    "suggestedAction" TEXT,
    "draftResponse" TEXT,
    "approvedResponse" TEXT,
    "rejectionReason" TEXT,
    "lastError" TEXT,
    "urgentWebhookSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Case_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseEvent" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CaseEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerSnapshot" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "externalCustomerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "company" TEXT,
    "status" TEXT NOT NULL,
    "rawData" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderSnapshot" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "externalOrderId" TEXT NOT NULL,
    "orderStatus" TEXT NOT NULL,
    "shippingStatus" TEXT NOT NULL,
    "shippingProvider" TEXT,
    "trackingNumber" TEXT,
    "rawData" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CallSnapshot" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "externalCallId" TEXT NOT NULL,
    "calledAt" TIMESTAMP(3) NOT NULL,
    "durationSeconds" INTEGER NOT NULL,
    "callStatus" TEXT NOT NULL,
    "note" TEXT,
    "rawData" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CallSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnrichmentRun" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EnrichmentRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationRun" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "enrichmentRunId" TEXT,
    "integrationName" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "IntegrationRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Case_externalRequestId_key" ON "Case"("externalRequestId");

-- CreateIndex
CREATE INDEX "CaseEvent_caseId_idx" ON "CaseEvent"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerSnapshot_caseId_key" ON "CustomerSnapshot"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "OrderSnapshot_caseId_key" ON "OrderSnapshot"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "CallSnapshot_caseId_key" ON "CallSnapshot"("caseId");

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

-- AddForeignKey
ALTER TABLE "CaseEvent" ADD CONSTRAINT "CaseEvent_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerSnapshot" ADD CONSTRAINT "CustomerSnapshot_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderSnapshot" ADD CONSTRAINT "OrderSnapshot_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallSnapshot" ADD CONSTRAINT "CallSnapshot_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnrichmentRun" ADD CONSTRAINT "EnrichmentRun_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationRun" ADD CONSTRAINT "IntegrationRun_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationRun" ADD CONSTRAINT "IntegrationRun_enrichmentRunId_fkey" FOREIGN KEY ("enrichmentRunId") REFERENCES "EnrichmentRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
