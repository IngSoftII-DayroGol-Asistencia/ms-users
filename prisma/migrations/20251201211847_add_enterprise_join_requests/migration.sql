-- CreateEnum
CREATE TYPE "JoinRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "EnterpriseJoinRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "enterpriseId" TEXT NOT NULL,
    "status" "JoinRequestStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "processedBy" TEXT,

    CONSTRAINT "EnterpriseJoinRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EnterpriseJoinRequest_userId_idx" ON "EnterpriseJoinRequest"("userId");

-- CreateIndex
CREATE INDEX "EnterpriseJoinRequest_enterpriseId_idx" ON "EnterpriseJoinRequest"("enterpriseId");

-- CreateIndex
CREATE INDEX "EnterpriseJoinRequest_status_idx" ON "EnterpriseJoinRequest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "EnterpriseJoinRequest_userId_enterpriseId_key" ON "EnterpriseJoinRequest"("userId", "enterpriseId");

-- AddForeignKey
ALTER TABLE "EnterpriseJoinRequest" ADD CONSTRAINT "EnterpriseJoinRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnterpriseJoinRequest" ADD CONSTRAINT "EnterpriseJoinRequest_enterpriseId_fkey" FOREIGN KEY ("enterpriseId") REFERENCES "Enterprise"("id") ON DELETE CASCADE ON UPDATE CASCADE;
