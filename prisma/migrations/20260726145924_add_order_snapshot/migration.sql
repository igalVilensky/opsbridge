-- CreateTable
CREATE TABLE "OrderSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caseId" TEXT NOT NULL,
    "externalOrderId" TEXT NOT NULL,
    "orderStatus" TEXT NOT NULL,
    "shippingStatus" TEXT NOT NULL,
    "shippingProvider" TEXT,
    "trackingNumber" TEXT,
    "rawData" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OrderSnapshot_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "OrderSnapshot_caseId_key" ON "OrderSnapshot"("caseId");
