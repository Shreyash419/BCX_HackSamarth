# 🌱 BCX — Bharat Carbon Exchange

> **India's Official Carbon Credit Registry, Marketplace, and Compliance Dashboard**
> Built on Next.js 15 App Router · PostgreSQL + Prisma ORM + Supabase · Full-Stack Production Ready

---

## 🏗️ Architecture Overview

```
BCX Platform (Next.js 15)
├── Role-Based Access Control (Admin / Developer / Buyer)
├── Server Actions → PostgreSQL via Prisma ORM (Supabase)
├── GenAI Layer (Mock → Genkit + Vertex AI ready)
└── UI: ShadCN-compatible components + Tailwind CSS
```

---

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/Shreyash419/BCX_HackSamarth.git
cd BCX_HackSamarth
npm install
```

### 2. Setup Environment
```bash
cp .env.example .env
# Fill in your DATABASE_URL from Supabase project settings
```

### 3. Setup Database
```bash
npm run db:generate   # Generate Prisma client
npm run db:push       # Push schema to PostgreSQL
npm run db:seed       # Seed demo users & data
```

### 4. Run Dev Server
```bash
npm run dev
# → http://localhost:3000
```

### Demo Credentials (seeded automatically)

| Role | Email | Password | Redirects to |
|------|-------|----------|-------------|
| 🏛️ Admin | `admin@bcx.gov.in` | `Admin@123` | `/admin/dashboard` |
| 🌱 Developer | `dev@greenenergy.in` | `Dev@123` | `/developer/dashboard` |
| 🏢 Buyer | `buyer@tatasteel.com` | `Buyer@123` | `/buyer/dashboard` |

---

## 📁 Project Structure

```
BCX_HackSamarth/
├── prisma/
│   ├── schema.prisma           # Full PostgreSQL schema (8 models)
│   ├── seed.ts                 # Demo data seeder (users, projects, credits)
│   └── setup.sql               # Raw SQL setup (for direct DB init)
│
├── prisma.config.ts            # Prisma configuration
│
└── src/
    ├── app/                    # Next.js App Router pages
    │   ├── admin/
    │   │   ├── dashboard/      # Registry stats + compliance alerts
    │   │   ├── projects/       # Review & approve projects
    │   │   └── credits/        # Issue / retire carbon credits
    │   ├── developer/
    │   │   ├── dashboard/      # Analytics overview + quick actions
    │   │   ├── projects/       # Project list table
    │   │   └── register-project/ # 3-step registration form
    │   ├── buyer/
    │   │   ├── dashboard/      # Portfolio summary + net zero progress
    │   │   └── history/        # Purchase & retirement history
    │   ├── api/auth/register/  # REST endpoint for user registration
    │   ├── marketplace/        # Credit marketplace with search + filters
    │   ├── ledger/             # Public transaction ledger
    │   ├── ai-assistant/       # AI validation flows (Genkit-ready)
    │   └── profile/            # User profile settings
    │
    ├── actions/
    │   └── actions.ts          # All server actions (Prisma-backed data access layer)
    │
    ├── components/
    │   └── layout/
    │       └── app-shell.tsx   # Sidebar + header + role-aware nav
    │
    ├── context/
    │   ├── AuthContext.tsx     # Auth + session management
    │   └── CartContext.tsx     # Buyer cart state
    │
    └── lib/
        ├── types.ts            # Domain TypeScript models
        ├── prisma.ts           # Prisma client singleton
        ├── mock-data.ts        # Fallback / dev data store
        └── ai-flows.ts         # Genkit-structured AI flows
```

---

## 🗃️ Database Schema

**8 Prisma Models** on PostgreSQL (Supabase):

| Model | Description |
|-------|-------------|
| `User` | Auth + role (admin / developer / buyer) |
| `CarbonProject` | Project details, status, integrity score, SDG goals |
| `CarbonCredit` | Individual credit tokens with serial numbers |
| `Transaction` | Immutable ledger of all buy/sell/retire events |
| `BuyerHolding` | Portfolio holdings per buyer per project |
| `CartItem` | Active shopping cart items |
| `ComplianceAlert` | Regulatory alerts tied to projects |
| `AIValidationResult` | AI integrity/validation result logs |

```bash
# Available DB commands
npm run db:generate   # Regenerate Prisma client after schema changes
npm run db:push       # Sync schema to database (no migration files)
npm run db:migrate    # Generate migration files + apply
npm run db:seed       # Seed demo data
npm run db:studio     # Open Prisma Studio (GUI)
npm run db:reset      # Reset + re-migrate + re-seed
```

---

## 🎯 Feature Matrix

### Admin / Registry Authority
- ✅ Statistics dashboard (credits issued, traded, retired, pending)
- ✅ Monthly volume bar chart
- ✅ Compliance alerts table (critical/warning/info)
- ✅ Project review with approve/reject actions (Prisma-backed)
- ✅ Carbon credit issuance with serial number generation (PostgreSQL)

### Project Developer
- ✅ Analytics overview with revenue estimates
- ✅ Project portfolio cards (integrity score, credits sold progress)
- ✅ Project table with all attributes
- ✅ 3-step project registration form (Info → Methodology → Credits)
- ✅ SDG goal alignment selection

### Buyer
- ✅ Portfolio dashboard (holdings, P&L, net zero progress)
- ✅ Purchase & retirement history
- ✅ Marketplace integration with cart

### Marketplace
- ✅ Search + sector filters + sort (price/score/availability)
- ✅ Project cards with integrity score bars
- ✅ Add to cart with quantity selector
- ✅ Cart state management

### Public Ledger
- ✅ Immutable transaction log (PostgreSQL persisted)
- ✅ Search by project, entity, block hash
- ✅ Transaction type badges (issuance/purchase/transfer/retirement)

### AI Assistant (Genkit-ready)
- ✅ Integrity Score Flow
- ✅ Project Validation Flow
- ✅ Market Price Flow
- ✅ Mock outputs with LLM-ready structure

---

## 🔌 Roadmap

### Phase 3: Genkit AI Integration
```typescript
// Replace in lib/ai-flows.ts:
const integrityScoreFlow = defineFlow(
  { name: 'integrityScore', inputSchema: ..., outputSchema: ... },
  async (input) => {
    const response = await generate({
      model: gemini15Pro,
      prompt: buildIntegrityPrompt(input),
    });
    return parseScore(response);
  }
);
```

### Phase 4: Blockchain Ledger
```typescript
// Add to actions/actions.ts after credit issuance:
await bcxContract.issueCredits(projectId, quantity, serialNumbers)
// Transaction hash recorded immutably on Polygon/Ethereum
```

---

## 🎨 Design System

| Token | Value | Usage |
|-------|-------|-------|
| Primary | `green-600` (#16a34a) | CTAs, active states |
| Background | `white` | Page backgrounds |
| Surface | `slate-50` | Cards, sidebar |
| Border | `slate-200` | All borders |
| Accent | `blue-500` | Links, portfolio data |
| Warning | `amber-500` | Pending status |
| Danger | `red-500` | Rejected/critical |

**Typography**: DM Sans (UI) + DM Mono (codes, numbers)

---

## 🛡️ Security

- ✅ Phase 1 & 2: bcryptjs password hashing (saltRounds=10), stored in PostgreSQL
- Phase 3: httpOnly JWT cookies + CSRF tokens
- Phase 4: RBAC middleware in Next.js Middleware
- Phase 5: Rate limiting, WAF, CERT-In compliance audit

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3 |
| ORM | Prisma (v7) |
| Database | PostgreSQL via Supabase |
| Auth | bcryptjs password hashing + session context |
| State | React Context + Server Actions |
| AI (future) | Genkit + Vertex AI Gemini |
| Ledger (future) | Polygon blockchain |

---

## 🇮🇳 BCX Compliance

- MoEFCC (Ministry of Environment, Forest & Climate Change) certified framework
- BIS standards for carbon accounting
- ISO 14064 methodology alignment
- Paris Agreement NDC tracking ready

---

*BCX Platform v2.0 · Full-Stack: Next.js 15 + Prisma + Supabase PostgreSQL · Built for enterprise-grade carbon trading*
