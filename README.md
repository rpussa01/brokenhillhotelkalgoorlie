# Broken Hill Hotel website and ordering system — Prisma + Neon

This version stores settings, categories, menu items, orders, order lines, payment status, and order counters in Neon PostgreSQL through Prisma ORM. It no longer reads or writes `data/db.json`, so it is suitable for Vercel serverless deployment.

## Local setup

1. Copy the environment template:

```bash
cp .env.example .env
```

2. Put your **newly rotated** Neon connection string in `DATABASE_URL`. Do not commit `.env`.

3. Install packages and create the database tables:

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm run seed
npm run dev
```

Open:
- Homepage: `http://localhost:3000`
- Ordering: `http://localhost:3000/order`
- Staff: `http://localhost:3000/admin`
- Kitchen: `http://localhost:3000/admin/kitchen`

## Vercel environment variables

Add these in Vercel Project Settings → Environment Variables:

- `DATABASE_URL`
- `ADMIN_PIN`
- `SESSION_SECRET`
- `NEXT_PUBLIC_BASE_URL` (your production URL)
- Optional: `STRIPE_SECRET_KEY`
- Optional: `STRIPE_WEBHOOK_SECRET`

Then deploy the database once from your Mac:

```bash
npx prisma migrate deploy
npm run seed
```

Push the project to GitHub. Vercel runs `postinstall: prisma generate` automatically during deployment.

## Useful commands

```bash
npm run db:generate
npm run db:push
npm run db:migrate
npm run db:deploy
npm run seed
```

`npm run seed` uses upserts, so it does not delete existing orders.

## Security

The database password previously shared should be rotated in Neon. Use the replacement connection string only in `.env` and Vercel environment variables.
