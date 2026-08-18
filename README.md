# CommercePilot

E-commerce profit intelligence for Shopify merchants.

CommercePilot connects store data and advertising data into a simple dashboard: revenue, costs, ad spend, true profit, margins, ROAS, CAC, AOV, product performance, and actionable insights.

This repository currently contains the **application foundation** — routing, environment setup, Prisma + PostgreSQL, and reusable UI. Integrations and profit calculations are not implemented yet.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- PostgreSQL + Prisma ORM

## Getting started

```bash
npm install
cp .env.example .env
# set DATABASE_URL to a PostgreSQL instance
npx prisma migrate dev --name init
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
app/                 # App Router pages and API routes
  (app)/             # Authenticated product shell
  (auth)/            # Sign-in / sign-up placeholders
  api/health/        # Health + database ping
components/          # Shared UI (shadcn + layout)
lib/                 # env, Prisma client, formatters
prisma/schema.prisma # Users, stores, products, ads, insights
```

## Environment

See `.env.example`. Required for Prisma:

- `DATABASE_URL` — PostgreSQL connection string

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Run migrations |
