"use server";

/**
 * BCX Server Actions — Powered by Prisma + PostgreSQL
 *
 * All reads/writes go to the real database.
 */

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import type {
  User,
  CarbonProject,
  Transaction,
  AdminStats,
  ComplianceAlert,
  BuyerPortfolio,
  ProjectStatus,
} from "@/lib/types";

// ─── Helper: map Prisma User → App User type ─────────────────────────────────

function mapUser(u: {
  id: string;
  name: string;
  email: string;
  role: string;
  organization: string | null;
  createdAt: Date;
}): User {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role as User["role"],
    organization: u.organization ?? undefined,
    createdAt: u.createdAt.toISOString(),
  };
}

function mapProject(p: any): CarbonProject {
  return {
    id: p.id,
    name: p.name,
    developerId: p.developerId,
    developerName: p.developer?.name ?? "",
    sector: p.sector.replace(/([A-Z])/g, " $1").trim() as CarbonProject["sector"],
    location: p.location,
    state: p.state,
    vintage: p.vintage,
    totalCredits: p.totalCredits,
    availableCredits: p.availableCredits,
    pricePerCredit: p.pricePerCredit,
    status: p.status as CarbonProject["status"],
    integrityScore: p.integrityScore,
    methodology: p.methodology,
    description: p.description,
    co2Reduction: p.co2Reduction,
    sdgGoals: p.sdgGoals,
    createdAt: p.createdAt.toISOString(),
    approvedAt: p.approvedAt?.toISOString(),
    imageUrl: p.imageUrl ?? undefined,
  };
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function loginUser(
  email: string,
  password: string
): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const dbUser = await prisma.user.findUnique({ where: { email } });
    if (!dbUser) return { success: false, error: "Invalid email or password." };

    const valid = await bcrypt.compare(password, dbUser.passwordHash);
    if (!valid) return { success: false, error: "Invalid email or password." };

    return { success: true, user: mapUser(dbUser) };
  } catch (err) {
    console.error("[BCX] loginUser error:", err);
    return { success: false, error: "Server error. Please try again." };
  }
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export async function getAdminStats(): Promise<AdminStats> {
  const [
    totalIssued,
    totalTraded,
    totalRetired,
    pendingApprovals,
    activeProjects,
    registeredDevelopers,
    registeredBuyers,
    monthlyRaw,
  ] = await Promise.all([
    prisma.carbonCredit.aggregate({ _sum: { quantity: true } }),
    prisma.transaction.aggregate({
      where: { type: "purchase" },
      _sum: { quantity: true },
    }),
    prisma.carbonCredit.aggregate({
      where: { status: "retired" },
      _sum: { quantity: true },
    }),
    prisma.carbonProject.count({ where: { status: "pending" } }),
    prisma.carbonProject.count({ where: { status: "active" } }),
    prisma.user.count({ where: { role: "developer" } }),
    prisma.user.count({ where: { role: "buyer" } }),
    prisma.transaction.findMany({
      where: { type: "purchase" },
      select: { timestamp: true, quantity: true, totalValue: true },
      orderBy: { timestamp: "asc" },
    }),
  ]);

  const monthMap: Record<string, { volume: number; value: number }> = {};
  for (const tx of monthlyRaw) {
    const key = tx.timestamp.toISOString().slice(0, 7);
    if (!monthMap[key]) monthMap[key] = { volume: 0, value: 0 };
    monthMap[key].volume += tx.quantity;
    monthMap[key].value += tx.totalValue ?? 0;
  }
  const monthlyVolume = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, data]) => ({ month, ...data }));

  return {
    totalCreditsIssued: totalIssued._sum.quantity ?? 0,
    totalCreditsTraded: totalTraded._sum.quantity ?? 0,
    totalCreditsRetired: totalRetired._sum.quantity ?? 0,
    pendingApprovals,
    activeProjects,
    registeredDevelopers,
    registeredBuyers,
    monthlyVolume,
  };
}

export async function getComplianceAlerts(): Promise<ComplianceAlert[]> {
  const alerts = await prisma.complianceAlert.findMany({
    where: { resolved: false },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return alerts.map((a) => ({
    id: a.id,
    type: a.type as ComplianceAlert["type"],
    entity: a.entity,
    message: a.message,
    projectId: a.projectId ?? undefined,
    timestamp: a.createdAt.toISOString(),
    resolved: a.resolved,
  }));
}

export async function approveProject(
  projectId: string
): Promise<{ success: boolean }> {
  await prisma.carbonProject.update({
    where: { id: projectId },
    data: { status: "active", approvedAt: new Date() },
  });
  return { success: true };
}

export async function rejectProject(
  projectId: string,
  reason: string
): Promise<{ success: boolean }> {
  await Promise.all([
    prisma.carbonProject.update({
      where: { id: projectId },
      data: { status: "rejected" },
    }),
    prisma.complianceAlert.create({
      data: {
        type: "warning",
        entity: `Project ${projectId}`,
        message: `Project rejected: ${reason}`,
        projectId,
      },
    }),
  ]);
  return { success: true };
}

export async function issueCredits(
  projectId: string,
  quantity: number
): Promise<{ success: boolean; serialNumbers?: string[] }> {
  const project = await prisma.carbonProject.findUnique({ where: { id: projectId } });
  if (!project) return { success: false };

  const batchSize = Math.min(quantity, 5);
  const serials: string[] = [];

  await prisma.$transaction(async (tx) => {
    for (let i = 0; i < batchSize; i++) {
      const serial = `BCX-${projectId.toUpperCase().slice(0, 6)}-${project.vintage}-${String(Date.now() + i).slice(-4)}`;
      serials.push(serial);
      await tx.carbonCredit.create({
        data: {
          projectId,
          serialNumber: serial,
          vintage: project.vintage,
          quantity: Math.floor(quantity / batchSize),
          status: "issued",
        },
      });
    }
    await tx.transaction.create({
      data: {
        type: "issuance",
        projectId,
        toUserId: project.developerId,
        quantity,
        status: "confirmed",
      },
    });
  });

  return { success: true, serialNumbers: serials };
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export async function getProjects(filters?: {
  status?: ProjectStatus;
  developerId?: string;
  sector?: string;
}): Promise<CarbonProject[]> {
  const where: any = {};
  if (filters?.status) where.status = filters.status;
  if (filters?.developerId) where.developerId = filters.developerId;
  if (filters?.sector) where.sector = filters.sector;

  const projects = await prisma.carbonProject.findMany({
    where,
    include: { developer: true },
    orderBy: { createdAt: "desc" },
  });
  return projects.map(mapProject);
}

export async function getProjectById(
  id: string
): Promise<CarbonProject | null> {
  const p = await prisma.carbonProject.findUnique({
    where: { id },
    include: { developer: true },
  });
  return p ? mapProject(p) : null;
}

export async function registerProject(
  data: Partial<CarbonProject> & { developerId: string }
): Promise<{ success: boolean; projectId?: string; error?: string }> {
  try {
    const sectorMap: Record<string, string> = {
      "Renewable Energy": "RenewableEnergy",
      Afforestation: "Afforestation",
      "Methane Capture": "MethaneCapture",
      "Energy Efficiency": "EnergyEfficiency",
      "Blue Carbon": "BlueCarbon",
      "Soil Carbon": "SoilCarbon",
      "Waste Management": "WasteManagement",
    };
    const project = await prisma.carbonProject.create({
      data: {
        name: data.name!,
        developerId: data.developerId,
        sector: (sectorMap[data.sector!] ?? "RenewableEnergy") as any,
        location: data.location ?? "",
        state: data.state ?? "",
        vintage: data.vintage ?? new Date().getFullYear(),
        totalCredits: data.totalCredits ?? 0,
        availableCredits: data.availableCredits ?? data.totalCredits ?? 0,
        pricePerCredit: data.pricePerCredit ?? 0,
        status: "pending",
        methodology: data.methodology ?? "",
        description: data.description ?? "",
        co2Reduction: data.co2Reduction ?? 0,
        sdgGoals: data.sdgGoals ?? [],
        imageUrl: data.imageUrl,
      },
    });
    return { success: true, projectId: project.id };
  } catch (err: any) {
    console.error("[BCX] registerProject error:", err);
    return { success: false, error: err.message };
  }
}

// ─── Marketplace ──────────────────────────────────────────────────────────────

export async function getMarketplaceData(filters?: {
  sector?: string;
  minPrice?: number;
  maxPrice?: number;
  minScore?: number;
}): Promise<CarbonProject[]> {
  const where: any = { status: "active" };
  if (filters?.sector) where.sector = filters.sector;
  if (filters?.minPrice !== undefined || filters?.maxPrice !== undefined) {
    where.pricePerCredit = {};
    if (filters.minPrice !== undefined) where.pricePerCredit.gte = filters.minPrice;
    if (filters.maxPrice !== undefined) where.pricePerCredit.lte = filters.maxPrice;
  }
  if (filters?.minScore !== undefined) {
    where.integrityScore = { gte: filters.minScore };
  }

  const projects = await prisma.carbonProject.findMany({
    where,
    include: { developer: true },
    orderBy: { integrityScore: "desc" },
  });
  return projects.map(mapProject);
}

export async function purchaseCredits(
  projectId: string,
  quantity: number,
  buyerId: string
): Promise<{ success: boolean; transactionId?: string; error?: string }> {
  try {
    const project = await prisma.carbonProject.findUnique({ where: { id: projectId } });
    if (!project) return { success: false, error: "Project not found." };
    if (project.availableCredits < quantity)
      return { success: false, error: "Not enough credits available." };

    const totalValue = quantity * project.pricePerCredit;
    const [tx] = await prisma.$transaction([
      prisma.transaction.create({
        data: {
          type: "purchase",
          projectId,
          fromUserId: project.developerId,
          toUserId: buyerId,
          quantity,
          pricePerCredit: project.pricePerCredit,
          totalValue,
          status: "confirmed",
          blockHash: `0x${Math.random().toString(16).slice(2, 18)}`,
        },
      }),
      prisma.carbonProject.update({
        where: { id: projectId },
        data: { availableCredits: { decrement: quantity } },
      }),
      prisma.buyerHolding.upsert({
        where: { buyerId_projectId: { buyerId, projectId } },
        create: { buyerId, projectId, quantity, avgPrice: project.pricePerCredit },
        update: { quantity: { increment: quantity } },
      }),
    ]);
    return { success: true, transactionId: tx.id };
  } catch (err: any) {
    console.error("[BCX] purchaseCredits error:", err);
    return { success: false, error: err.message };
  }
}

// ─── Ledger ───────────────────────────────────────────────────────────────────

export async function getLedgerTransactions(page = 1, pageSize = 20): Promise<{
  transactions: Transaction[];
  total: number;
}> {
  const [raw, total] = await Promise.all([
    prisma.transaction.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { timestamp: "desc" },
      include: { project: true, fromUser: true, toUser: true },
    }),
    prisma.transaction.count(),
  ]);

  return {
    transactions: raw.map((t) => ({
      id: t.id,
      type: t.type as Transaction["type"],
      projectId: t.projectId,
      projectName: t.project.name,
      from: t.fromUser?.name ?? "BCX Registry",
      to: t.toUser.name,
      quantity: t.quantity,
      pricePerCredit: t.pricePerCredit ?? undefined,
      totalValue: t.totalValue ?? undefined,
      timestamp: t.timestamp.toISOString(),
      blockHash: t.blockHash ?? undefined,
      status: t.status as Transaction["status"],
    })),
    total,
  };
}

// ─── Buyer ────────────────────────────────────────────────────────────────────

export async function getBuyerPortfolio(buyerId: string): Promise<BuyerPortfolio> {
  const [holdings, retiredAgg, spentAgg] = await Promise.all([
    prisma.buyerHolding.findMany({
      where: { buyerId },
      include: { project: true },
    }),
    prisma.carbonCredit.aggregate({
      where: { issuedToId: buyerId, status: "retired" },
      _sum: { quantity: true },
    }),
    prisma.transaction.aggregate({
      where: { toUserId: buyerId, type: "purchase" },
      _sum: { totalValue: true },
    }),
  ]);

  return {
    totalCreditsOwned: holdings.reduce((sum, h) => sum + h.quantity, 0),
    totalCreditsRetired: retiredAgg._sum.quantity ?? 0,
    totalSpent: spentAgg._sum.totalValue ?? 0,
    carbonOffset: retiredAgg._sum.quantity ?? 0,
    holdings: holdings.map((h) => ({
      projectId: h.projectId,
      projectName: h.project.name,
      sector: h.project.sector.replace(/([A-Z])/g, " $1").trim() as any,
      quantity: h.quantity,
      avgPrice: h.avgPrice,
      currentPrice: h.project.pricePerCredit,
      purchasedAt: h.purchasedAt.toISOString(),
    })),
  };
}

export async function retireCredits(
  projectId: string,
  quantity: number,
  buyerId: string,
  reason: string
): Promise<{ success: boolean; retirementId?: string }> {
  try {
    const [retireTx] = await prisma.$transaction([
      prisma.transaction.create({
        data: {
          type: "retirement",
          projectId,
          toUserId: buyerId,
          quantity,
          status: "confirmed",
        },
      }),
      prisma.buyerHolding.update({
        where: { buyerId_projectId: { buyerId, projectId } },
        data: { quantity: { decrement: quantity } },
      }),
      prisma.complianceAlert.create({
        data: {
          type: "info",
          entity: buyerId,
          message: `${quantity} credits retired from project ${projectId}. Reason: ${reason}`,
          projectId,
          resolved: true,
        },
      }),
    ]);
    return { success: true, retirementId: retireTx.id };
  } catch (err: any) {
    console.error("[BCX] retireCredits error:", err);
    return { success: false };
  }
}
