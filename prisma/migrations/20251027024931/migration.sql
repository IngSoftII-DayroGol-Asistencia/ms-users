/*
  Warnings:

  - A unique constraint covering the columns `[enterpriseId,name]` on the table `Role` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `enterpriseId` to the `Role` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "RelationshipType" AS ENUM ('CONTACT', 'COLLABORATOR', 'FRIEND', 'COLLEAGUE', 'MENTOR', 'MENTEE', 'TEAM_MEMBER');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ResourceType" ADD VALUE 'ENTERPRISE';
ALTER TYPE "ResourceType" ADD VALUE 'USER_RELATIONSHIPS';

-- DropIndex
DROP INDEX "public"."Role_name_key";

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "enterpriseId" TEXT;

-- AlterTable
ALTER TABLE "Role" ADD COLUMN     "enterpriseId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Enterprise" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "logo" TEXT,
    "website" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Enterprise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserEnterprise" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "enterpriseId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserEnterprise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRelationship" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "relatedUserId" TEXT NOT NULL,
    "relationshipType" "RelationshipType" NOT NULL DEFAULT 'CONTACT',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserRelationship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnterprisePermission" (
    "id" TEXT NOT NULL,
    "enterpriseId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "grantedBy" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "EnterprisePermission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Enterprise_name_key" ON "Enterprise"("name");

-- CreateIndex
CREATE INDEX "Enterprise_name_idx" ON "Enterprise"("name");

-- CreateIndex
CREATE INDEX "UserEnterprise_userId_idx" ON "UserEnterprise"("userId");

-- CreateIndex
CREATE INDEX "UserEnterprise_enterpriseId_idx" ON "UserEnterprise"("enterpriseId");

-- CreateIndex
CREATE UNIQUE INDEX "UserEnterprise_userId_enterpriseId_key" ON "UserEnterprise"("userId", "enterpriseId");

-- CreateIndex
CREATE INDEX "UserRelationship_userId_idx" ON "UserRelationship"("userId");

-- CreateIndex
CREATE INDEX "UserRelationship_relatedUserId_idx" ON "UserRelationship"("relatedUserId");

-- CreateIndex
CREATE INDEX "UserRelationship_status_idx" ON "UserRelationship"("status");

-- CreateIndex
CREATE UNIQUE INDEX "UserRelationship_userId_relatedUserId_key" ON "UserRelationship"("userId", "relatedUserId");

-- CreateIndex
CREATE INDEX "EnterprisePermission_enterpriseId_idx" ON "EnterprisePermission"("enterpriseId");

-- CreateIndex
CREATE INDEX "EnterprisePermission_permissionId_idx" ON "EnterprisePermission"("permissionId");

-- CreateIndex
CREATE INDEX "EnterprisePermission_grantedBy_idx" ON "EnterprisePermission"("grantedBy");

-- CreateIndex
CREATE UNIQUE INDEX "EnterprisePermission_enterpriseId_permissionId_key" ON "EnterprisePermission"("enterpriseId", "permissionId");

-- CreateIndex
CREATE INDEX "AuditLog_enterpriseId_idx" ON "AuditLog"("enterpriseId");

-- CreateIndex
CREATE INDEX "Role_enterpriseId_idx" ON "Role"("enterpriseId");

-- CreateIndex
CREATE UNIQUE INDEX "Role_enterpriseId_name_key" ON "Role"("enterpriseId", "name");

-- AddForeignKey
ALTER TABLE "UserEnterprise" ADD CONSTRAINT "UserEnterprise_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserEnterprise" ADD CONSTRAINT "UserEnterprise_enterpriseId_fkey" FOREIGN KEY ("enterpriseId") REFERENCES "Enterprise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRelationship" ADD CONSTRAINT "UserRelationship_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRelationship" ADD CONSTRAINT "UserRelationship_relatedUserId_fkey" FOREIGN KEY ("relatedUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_enterpriseId_fkey" FOREIGN KEY ("enterpriseId") REFERENCES "Enterprise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnterprisePermission" ADD CONSTRAINT "EnterprisePermission_enterpriseId_fkey" FOREIGN KEY ("enterpriseId") REFERENCES "Enterprise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnterprisePermission" ADD CONSTRAINT "EnterprisePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnterprisePermission" ADD CONSTRAINT "EnterprisePermission_grantedBy_fkey" FOREIGN KEY ("grantedBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_enterpriseId_fkey" FOREIGN KEY ("enterpriseId") REFERENCES "Enterprise"("id") ON DELETE SET NULL ON UPDATE CASCADE;
