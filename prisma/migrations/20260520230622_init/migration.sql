-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('BROKER', 'AGENT', 'CLIENT');

-- CreateEnum
CREATE TYPE "BrokeragePlan" AS ENUM ('FREE', 'PRO');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'NURTURING', 'CLOSED_WON', 'CLOSED_LOST');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('MANUAL', 'MLS', 'WEBSITE', 'REFERRAL', 'SOCIAL', 'OTHER');

-- CreateEnum
CREATE TYPE "PropertyStatus" AS ENUM ('ACTIVE', 'PENDING', 'SOLD', 'EXPIRED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('ACTIVE', 'UNDER_CONTRACT', 'PENDING_CLOSE', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PartyRole" AS ENUM ('AGENT', 'LENDER', 'TITLE', 'ATTORNEY');

-- CreateEnum
CREATE TYPE "ContingencyType" AS ENUM ('INSPECTION', 'FINANCING', 'APPRAISAL', 'TITLE', 'SALE_OF_HOME', 'OTHER');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('OPEN', 'COMPLETED');

-- CreateEnum
CREATE TYPE "SequenceStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RiskScore" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'BROKER',
    "brokerageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Brokerage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "stripeCustomerId" TEXT,
    "plan" "BrokeragePlan" NOT NULL DEFAULT 'FREE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Brokerage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "brokerageId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "source" "LeadSource" NOT NULL DEFAULT 'MANUAL',
    "assignedTo" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "brokerageId" TEXT NOT NULL,
    "mlsId" TEXT,
    "address" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "beds" INTEGER,
    "baths" DECIMAL(4,1),
    "sqft" INTEGER,
    "status" "PropertyStatus" NOT NULL DEFAULT 'ACTIVE',
    "listedAt" TIMESTAMP(3),
    "rawData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "brokerageId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "buyerId" TEXT,
    "sellerId" TEXT,
    "status" "TransactionStatus" NOT NULL DEFAULT 'ACTIVE',
    "closeDate" TIMESTAMP(3),
    "purchasePrice" DECIMAL(12,2),
    "earnestMoney" DECIMAL(12,2),
    "riskScore" "RiskScore",
    "riskFlags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionParty" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "role" "PartyRole" NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,

    CONSTRAINT "TransactionParty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContingencyDeadline" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "type" "ContingencyType" NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "ContingencyDeadline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT,
    "brokerageId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "assignedTo" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NurtureSequence" (
    "id" TEXT NOT NULL,
    "brokerageId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "status" "SequenceStatus" NOT NULL DEFAULT 'ACTIVE',
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "nextSendAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NurtureSequence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_brokerageId_idx" ON "User"("brokerageId");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Brokerage_ownerId_key" ON "Brokerage"("ownerId");

-- CreateIndex
CREATE INDEX "Lead_brokerageId_idx" ON "Lead"("brokerageId");

-- CreateIndex
CREATE INDEX "Lead_status_idx" ON "Lead"("status");

-- CreateIndex
CREATE INDEX "Lead_source_idx" ON "Lead"("source");

-- CreateIndex
CREATE INDEX "Lead_assignedTo_idx" ON "Lead"("assignedTo");

-- CreateIndex
CREATE UNIQUE INDEX "Property_mlsId_key" ON "Property"("mlsId");

-- CreateIndex
CREATE INDEX "Property_brokerageId_idx" ON "Property"("brokerageId");

-- CreateIndex
CREATE INDEX "Property_status_idx" ON "Property"("status");

-- CreateIndex
CREATE INDEX "Property_mlsId_idx" ON "Property"("mlsId");

-- CreateIndex
CREATE INDEX "Transaction_brokerageId_idx" ON "Transaction"("brokerageId");

-- CreateIndex
CREATE INDEX "Transaction_status_idx" ON "Transaction"("status");

-- CreateIndex
CREATE INDEX "Transaction_propertyId_idx" ON "Transaction"("propertyId");

-- CreateIndex
CREATE INDEX "TransactionParty_transactionId_idx" ON "TransactionParty"("transactionId");

-- CreateIndex
CREATE INDEX "ContingencyDeadline_transactionId_idx" ON "ContingencyDeadline"("transactionId");

-- CreateIndex
CREATE INDEX "ContingencyDeadline_dueDate_idx" ON "ContingencyDeadline"("dueDate");

-- CreateIndex
CREATE INDEX "Task_brokerageId_idx" ON "Task"("brokerageId");

-- CreateIndex
CREATE INDEX "Task_transactionId_idx" ON "Task"("transactionId");

-- CreateIndex
CREATE INDEX "Task_status_idx" ON "Task"("status");

-- CreateIndex
CREATE INDEX "Task_dueDate_idx" ON "Task"("dueDate");

-- CreateIndex
CREATE INDEX "NurtureSequence_brokerageId_idx" ON "NurtureSequence"("brokerageId");

-- CreateIndex
CREATE INDEX "NurtureSequence_leadId_idx" ON "NurtureSequence"("leadId");

-- CreateIndex
CREATE INDEX "NurtureSequence_status_idx" ON "NurtureSequence"("status");

-- CreateIndex
CREATE INDEX "NurtureSequence_nextSendAt_idx" ON "NurtureSequence"("nextSendAt");

-- CreateIndex
CREATE INDEX "Document_transactionId_idx" ON "Document"("transactionId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_brokerageId_fkey" FOREIGN KEY ("brokerageId") REFERENCES "Brokerage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Brokerage" ADD CONSTRAINT "Brokerage_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_brokerageId_fkey" FOREIGN KEY ("brokerageId") REFERENCES "Brokerage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_brokerageId_fkey" FOREIGN KEY ("brokerageId") REFERENCES "Brokerage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_brokerageId_fkey" FOREIGN KEY ("brokerageId") REFERENCES "Brokerage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionParty" ADD CONSTRAINT "TransactionParty_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContingencyDeadline" ADD CONSTRAINT "ContingencyDeadline_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_brokerageId_fkey" FOREIGN KEY ("brokerageId") REFERENCES "Brokerage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NurtureSequence" ADD CONSTRAINT "NurtureSequence_brokerageId_fkey" FOREIGN KEY ("brokerageId") REFERENCES "Brokerage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NurtureSequence" ADD CONSTRAINT "NurtureSequence_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
