/**
 * BCX Database Seed
 * Run: npx prisma db seed
 *
 * Seeds demo users, projects, transactions, and compliance alerts
 * for development and testing.
 */

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log("🌱 Seeding BCX database...");

  // ─── Users ──────────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash("Admin@123", 10);
  const devHash = await bcrypt.hash("Dev@123", 10);
  const buyerHash = await bcrypt.hash("Buyer@123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@bcx.gov.in" },
    update: {},
    create: {
      name: "Priya Sharma",
      email: "admin@bcx.gov.in",
      passwordHash,
      role: "admin",
      organization: "Ministry of Environment, Forest & Climate Change",
    },
  });

  const developer = await prisma.user.upsert({
    where: { email: "dev@greenenergy.in" },
    update: {},
    create: {
      name: "Arjun Mehta",
      email: "dev@greenenergy.in",
      passwordHash: devHash,
      role: "developer",
      organization: "Green Horizon Energy Pvt. Ltd.",
    },
  });

  const developer2 = await prisma.user.upsert({
    where: { email: "dev@agrocarbon.in" },
    update: {},
    create: {
      name: "Ramesh Patel",
      email: "dev@agrocarbon.in",
      passwordHash: devHash,
      role: "developer",
      organization: "AgroCarbon Solutions",
    },
  });

  const buyer = await prisma.user.upsert({
    where: { email: "buyer@tatasteel.com" },
    update: {},
    create: {
      name: "Sunita Patel",
      email: "buyer@tatasteel.com",
      passwordHash: buyerHash,
      role: "buyer",
      organization: "Tata Steel Ltd.",
    },
  });

  const buyer2 = await prisma.user.upsert({
    where: { email: "buyer@reliance.com" },
    update: {},
    create: {
      name: "Vikram Nair",
      email: "buyer@reliance.com",
      passwordHash: buyerHash,
      role: "buyer",
      organization: "Reliance Industries Ltd.",
    },
  });

  console.log("✅ Users seeded");

  // ─── Projects ────────────────────────────────────────────────────────────────
  const project1 = await prisma.carbonProject.upsert({
    where: { id: "prj001" },
    update: {},
    create: {
      id: "prj001",
      name: "Rajasthan Wind Power Initiative",
      developerId: developer.id,
      approvedById: admin.id,
      sector: "RenewableEnergy",
      location: "Jaisalmer, Rajasthan",
      state: "Rajasthan",
      vintage: 2024,
      totalCredits: 50000,
      availableCredits: 32000,
      pricePerCredit: 850,
      status: "active",
      integrityScore: 92,
      methodology: "ACM0002 - Grid-connected electricity generation from renewable sources",
      description:
        "A 120 MW wind farm displacing coal-based grid electricity in the energy-deficit Rajasthan region, generating verified emission reductions for the Indian grid.",
      co2Reduction: 180000,
      sdgGoals: [7, 13, 8],
      approvedAt: new Date("2024-02-05"),
    },
  });

  const project2 = await prisma.carbonProject.upsert({
    where: { id: "prj002" },
    update: {},
    create: {
      id: "prj002",
      name: "Western Ghats Afforestation",
      developerId: developer.id,
      approvedById: admin.id,
      sector: "Afforestation",
      location: "Sahyadri Range, Maharashtra",
      state: "Maharashtra",
      vintage: 2023,
      totalCredits: 25000,
      availableCredits: 18500,
      pricePerCredit: 620,
      status: "active",
      integrityScore: 88,
      methodology: "AR-AM0014 - Afforestation and reforestation of degraded lands",
      description:
        "Restoration of 5,000 hectares of degraded land in the Western Ghats biodiversity hotspot, sequestering carbon while restoring critical wildlife corridors.",
      co2Reduction: 75000,
      sdgGoals: [13, 15, 1],
      approvedAt: new Date("2023-10-15"),
    },
  });

  const project3 = await prisma.carbonProject.upsert({
    where: { id: "prj003" },
    update: {},
    create: {
      id: "prj003",
      name: "Punjab Agricultural Methane Capture",
      developerId: developer2.id,
      approvedById: admin.id,
      sector: "MethaneCapture",
      location: "Ludhiana, Punjab",
      state: "Punjab",
      vintage: 2024,
      totalCredits: 15000,
      availableCredits: 12000,
      pricePerCredit: 920,
      status: "active",
      integrityScore: 84,
      methodology: "AMS-III.D - Methane recovery in manure management systems",
      description:
        "Biogas capture from 50 large dairy farms in Punjab preventing methane release from animal waste ponds, with energy generation for rural communities.",
      co2Reduction: 45000,
      sdgGoals: [7, 13, 2],
      approvedAt: new Date("2024-03-10"),
    },
  });

  const project4 = await prisma.carbonProject.upsert({
    where: { id: "prj004" },
    update: {},
    create: {
      id: "prj004",
      name: "Sundarbans Blue Carbon Initiative",
      developerId: developer2.id,
      sector: "BlueCarbon",
      location: "Sundarbans Delta, West Bengal",
      state: "West Bengal",
      vintage: 2024,
      totalCredits: 30000,
      availableCredits: 30000,
      pricePerCredit: 1150,
      status: "pending",
      integrityScore: 0,
      methodology: "VM0033 - Tidal Wetland and Seagrass Restoration",
      description:
        "Conservation and restoration of mangrove ecosystems in the Sundarbans, one of the world's largest coastal wetlands, with high carbon sequestration potential.",
      co2Reduction: 90000,
      sdgGoals: [14, 13, 1, 15],
    },
  });

  console.log("✅ Projects seeded");

  // ─── Carbon Credits (sample batch) ──────────────────────────────────────────
  const creditData = [
    { projectId: project1.id, serial: "BCX-PRJ001-2024-0001", vintage: 2024, quantity: 5000 },
    { projectId: project1.id, serial: "BCX-PRJ001-2024-0002", vintage: 2024, quantity: 5000 },
    { projectId: project2.id, serial: "BCX-PRJ002-2023-0001", vintage: 2023, quantity: 3000 },
    { projectId: project3.id, serial: "BCX-PRJ003-2024-0001", vintage: 2024, quantity: 2000 },
  ];

  for (const c of creditData) {
    await prisma.carbonCredit.upsert({
      where: { serialNumber: c.serial },
      update: {},
      create: {
        projectId: c.projectId,
        serialNumber: c.serial,
        vintage: c.vintage,
        quantity: c.quantity,
        status: "issued",
        issuedToId: developer.id,
      },
    });
  }

  console.log("✅ Credits seeded");

  // ─── Transactions ────────────────────────────────────────────────────────────
  const tx1 = await prisma.transaction.upsert({
    where: { id: "txn001" },
    update: {},
    create: {
      id: "txn001",
      type: "purchase",
      projectId: project1.id,
      fromUserId: developer.id,
      toUserId: buyer.id,
      quantity: 5000,
      pricePerCredit: 820,
      totalValue: 4100000,
      status: "confirmed",
      blockHash: "0x3a7f1c2b9e4d8a5f0b6c3e2d1a8f4b7c",
      timestamp: new Date("2024-03-15"),
    },
  });

  await prisma.transaction.upsert({
    where: { id: "txn002" },
    update: {},
    create: {
      id: "txn002",
      type: "purchase",
      projectId: project2.id,
      fromUserId: developer.id,
      toUserId: buyer2.id,
      quantity: 3000,
      pricePerCredit: 600,
      totalValue: 1800000,
      status: "confirmed",
      blockHash: "0x8b2e5d1f4a7c0b3e6d9f2a5c8e1b4d7a",
      timestamp: new Date("2024-04-01"),
    },
  });

  await prisma.transaction.upsert({
    where: { id: "txn003" },
    update: {},
    create: {
      id: "txn003",
      type: "retirement",
      projectId: project1.id,
      toUserId: buyer.id,
      quantity: 2000,
      status: "confirmed",
      blockHash: "0xc5e8a2d7f1b4e0c3a6d9f2b5e8c1a4d7",
      timestamp: new Date("2024-05-10"),
    },
  });

  console.log("✅ Transactions seeded");

  // ─── Buyer Holdings ──────────────────────────────────────────────────────────
  await prisma.buyerHolding.upsert({
    where: { buyerId_projectId: { buyerId: buyer.id, projectId: project1.id } },
    update: {},
    create: {
      buyerId: buyer.id,
      projectId: project1.id,
      quantity: 3000, // 5000 bought - 2000 retired
      avgPrice: 820,
    },
  });

  await prisma.buyerHolding.upsert({
    where: { buyerId_projectId: { buyerId: buyer2.id, projectId: project2.id } },
    update: {},
    create: {
      buyerId: buyer2.id,
      projectId: project2.id,
      quantity: 3000,
      avgPrice: 600,
    },
  });

  console.log("✅ Holdings seeded");

  // ─── Compliance Alerts ───────────────────────────────────────────────────────
  await prisma.complianceAlert.createMany({
    skipDuplicates: true,
    data: [
      {
        type: "warning",
        entity: "AgroCarbon Solutions",
        message: "MRV audit report overdue by 14 days for project prj003.",
        projectId: project3.id,
        resolved: false,
      },
      {
        type: "critical",
        entity: "Green Horizon Energy",
        message: "Satellite imagery discrepancy detected in project boundary for prj002.",
        projectId: project2.id,
        resolved: false,
      },
      {
        type: "info",
        entity: "BCX Registry",
        message: "New UNFCCC methodology update available — review ACM0002 v16.0.",
        resolved: false,
      },
    ],
  });

  console.log("✅ Compliance alerts seeded");
  console.log("\n🎉 BCX database seeded successfully!");
  console.log("\n📋 Demo Login Credentials:");
  console.log("   Admin:     admin@bcx.gov.in     / Admin@123");
  console.log("   Developer: dev@greenenergy.in   / Dev@123");
  console.log("   Developer: dev@agrocarbon.in    / Dev@123");
  console.log("   Buyer:     buyer@tatasteel.com  / Buyer@123");
  console.log("   Buyer:     buyer@reliance.com   / Buyer@123");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
