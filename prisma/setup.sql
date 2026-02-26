-- BCX — Bharat Carbon Exchange
-- Run this SQL in Supabase SQL Editor → New Query → Paste → Run

-- ─── Enums ───────────────────────────────────────────────────────────────────

CREATE TYPE "UserRole" AS ENUM ('admin', 'developer', 'buyer');
CREATE TYPE "ProjectSector" AS ENUM ('Renewable Energy', 'Afforestation', 'Methane Capture', 'Energy Efficiency', 'Blue Carbon', 'Soil Carbon', 'Waste Management');
CREATE TYPE "ProjectStatus" AS ENUM ('draft', 'pending', 'approved', 'rejected', 'active');
CREATE TYPE "CreditStatus" AS ENUM ('issued', 'traded', 'retired');
CREATE TYPE "TransactionType" AS ENUM ('issuance', 'transfer', 'retirement', 'purchase');
CREATE TYPE "TxStatus" AS ENUM ('confirmed', 'pending', 'failed');
CREATE TYPE "AlertType" AS ENUM ('warning', 'critical', 'info');
CREATE TYPE "RiskLevel" AS ENUM ('low', 'medium', 'high');

-- ─── Users ───────────────────────────────────────────────────────────────────

CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'buyer',
    "organization" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- ─── Carbon Projects ─────────────────────────────────────────────────────────

CREATE TABLE "carbon_projects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "developerId" TEXT NOT NULL,
    "approvedById" TEXT,
    "sector" "ProjectSector" NOT NULL,
    "location" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "vintage" INTEGER NOT NULL,
    "totalCredits" INTEGER NOT NULL,
    "availableCredits" INTEGER NOT NULL,
    "pricePerCredit" DOUBLE PRECISION NOT NULL,
    "status" "ProjectStatus" NOT NULL DEFAULT 'draft',
    "integrityScore" INTEGER NOT NULL DEFAULT 0,
    "methodology" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "co2Reduction" INTEGER NOT NULL,
    "sdgGoals" INTEGER[],
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "carbon_projects_pkey" PRIMARY KEY ("id")
);

-- ─── Carbon Credits ──────────────────────────────────────────────────────────

CREATE TABLE "carbon_credits" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "vintage" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "status" "CreditStatus" NOT NULL DEFAULT 'issued',
    "issuedToId" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retiredAt" TIMESTAMP(3),
    "retiredById" TEXT,
    CONSTRAINT "carbon_credits_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "carbon_credits_serialNumber_key" ON "carbon_credits"("serialNumber");

-- ─── Transactions ─────────────────────────────────────────────────────────────

CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "projectId" TEXT NOT NULL,
    "fromUserId" TEXT,
    "toUserId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "pricePerCredit" DOUBLE PRECISION,
    "totalValue" DOUBLE PRECISION,
    "status" "TxStatus" NOT NULL DEFAULT 'confirmed',
    "blockHash" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- ─── Buyer Holdings ───────────────────────────────────────────────────────────

CREATE TABLE "buyer_holdings" (
    "id" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "avgPrice" DOUBLE PRECISION NOT NULL,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "buyer_holdings_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "buyer_holdings_buyerId_projectId_key" ON "buyer_holdings"("buyerId", "projectId");

-- ─── Cart Items ───────────────────────────────────────────────────────────────

CREATE TABLE "cart_items" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "pricePerCredit" DOUBLE PRECISION NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "cart_items_userId_projectId_key" ON "cart_items"("userId", "projectId");

-- ─── Compliance Alerts ────────────────────────────────────────────────────────

CREATE TABLE "compliance_alerts" (
    "id" TEXT NOT NULL,
    "type" "AlertType" NOT NULL,
    "entity" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "projectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    CONSTRAINT "compliance_alerts_pkey" PRIMARY KEY ("id")
);

-- ─── AI Validation Results ────────────────────────────────────────────────────

CREATE TABLE "ai_validation_results" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "integrityScore" INTEGER NOT NULL,
    "riskLevel" "RiskLevel" NOT NULL,
    "findings" TEXT[],
    "recommendations" TEXT[],
    "modelUsed" TEXT NOT NULL,
    "validatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ai_validation_results_pkey" PRIMARY KEY ("id")
);

-- ─── Foreign Keys ─────────────────────────────────────────────────────────────

ALTER TABLE "carbon_projects" ADD CONSTRAINT "carbon_projects_developerId_fkey" FOREIGN KEY ("developerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "carbon_projects" ADD CONSTRAINT "carbon_projects_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "carbon_credits" ADD CONSTRAINT "carbon_credits_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "carbon_projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "carbon_credits" ADD CONSTRAINT "carbon_credits_issuedToId_fkey" FOREIGN KEY ("issuedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "carbon_projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "buyer_holdings" ADD CONSTRAINT "buyer_holdings_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "buyer_holdings" ADD CONSTRAINT "buyer_holdings_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "carbon_projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "carbon_projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "compliance_alerts" ADD CONSTRAINT "compliance_alerts_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "carbon_projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ai_validation_results" ADD CONSTRAINT "ai_validation_results_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "carbon_projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ─── Seed: Demo Users (passwords hashed via pgcrypto) ────────────────────────
-- admin@bcx.gov.in       → Admin@123
-- dev@greenenergy.in     → Dev@123
-- buyer@tatasteel.com    → Buyer@123

CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO "users" ("id", "name", "email", "passwordHash", "role", "organization", "updatedAt") VALUES
('u001', 'Priya Sharma',  'admin@bcx.gov.in',    crypt('Admin@123', gen_salt('bf', 10)), 'admin',     'Ministry of Environment, Forest & Climate Change', CURRENT_TIMESTAMP),
('u002', 'Arjun Mehta',   'dev@greenenergy.in',  crypt('Dev@123',   gen_salt('bf', 10)), 'developer', 'Green Horizon Energy Pvt. Ltd.', CURRENT_TIMESTAMP),
('u003', 'Sunita Patel',  'buyer@tatasteel.com', crypt('Buyer@123', gen_salt('bf', 10)), 'buyer',     'Tata Steel Ltd.', CURRENT_TIMESTAMP);

-- ─── Seed: Demo Projects ──────────────────────────────────────────────────────

INSERT INTO "carbon_projects" ("id","name","developerId","sector","location","state","vintage","totalCredits","availableCredits","pricePerCredit","status","integrityScore","methodology","description","co2Reduction","sdgGoals","updatedAt","approvedAt") VALUES
('prj001','Rajasthan Wind Power Initiative','u002','Renewable Energy','Jaisalmer, Rajasthan','Rajasthan',2024,50000,32000,850,'active',92,'ACM0002 - Grid-connected electricity generation from renewable sources','A 120 MW wind farm displacing coal-based grid electricity in the Rajasthan region.',180000,'{7,13,8}',CURRENT_TIMESTAMP,'2024-02-05'),
('prj002','Western Ghats Afforestation','u002','Afforestation','Sahyadri Range, Maharashtra','Maharashtra',2023,25000,18500,620,'active',88,'AR-AM0014 - Afforestation and reforestation of degraded lands','Restoration of 5,000 hectares of degraded land in the Western Ghats.',75000,'{13,15,1}',CURRENT_TIMESTAMP,'2023-10-15'),
('prj003','Punjab Agricultural Methane Capture','u002','Methane Capture','Ludhiana, Punjab','Punjab',2024,15000,12000,920,'active',85,'AMS-III.D - Methane recovery in manure management','Biogas capture from livestock waste across 200 farms in Punjab.',45000,'{7,13,2}',CURRENT_TIMESTAMP,'2024-03-20'),
('prj004','Kerala Blue Carbon Initiative','u002','Blue Carbon','Vembanad Lake, Kerala','Kerala',2024,8000,8000,1150,'pending',0,'VM0033 - Methodology for Tidal Wetland and Seagrass Restoration','Restoration of 800 hectares of mangroves along Kerala coastline.',24000,'{14,13,1}',CURRENT_TIMESTAMP, NULL);
