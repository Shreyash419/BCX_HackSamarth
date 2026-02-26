import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

// POST /api/auth/register
export async function POST(req: NextRequest) {
  try {
    const { name, email, password, role, organization } = await req.json();

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: "name, email, password, and role are required." },
        { status: 400 }
      );
    }

    if (!["admin", "developer", "buyer"].includes(role)) {
      return NextResponse.json({ error: "Invalid role." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "A user with this email already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { name, email, passwordHash, role, organization },
      select: { id: true, name: true, email: true, role: true, organization: true, createdAt: true },
    });

    return NextResponse.json({ success: true, user }, { status: 201 });
  } catch (err: any) {
    console.error("[BCX] Register error:", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
