# Wedly

**Love. Plan. Celebrate.**

Wedly is a wedding planning and vendor marketplace platform built for Tamil weddings in the Greater Toronto Area (GTA). It helps couples discover trusted vendors, manage budgets, plan multi-day events, and organize their wedding — all in one place.

## Tech Stack

- **Framework:** Next.js 15 (App Router, Server Components)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **Backend:** Supabase (PostgreSQL, Auth, Storage, RLS)
- **Hosting:** Vercel
- **Icons:** Lucide React
- **Validation:** Zod

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- A [Supabase](https://supabase.com) project

### 1. Clone and install

```bash
git clone https://github.com/your-username/wedly.git
cd wedly
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the migration file:
   - `supabase/migrations/00001_initial_schema.sql`
3. Then run the seed data:
   - `supabase/seed.sql`
4. Go to **Settings > API** and copy your project URL and anon key

### 3. Configure environment variables

Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Set up an admin user

1. Sign up through the app
2. In Supabase SQL Editor, promote your account:

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'your-email@example.com';
```

### 6. Enable Google OAuth (optional)

1. In Supabase Dashboard, go to **Authentication > Providers > Google**
2. Follow the setup instructions to add your Google OAuth credentials

## Deploying to Vercel

### 1. Push to GitHub

```bash
git add .
git commit -m "Initial Wedly MVP"
git push origin main
```

### 2. Import to Vercel

1. Go to [vercel.com](https://vercel.com) and import your GitHub repo
2. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy

### 3. Custom domain

The CNAME file points to `planwedly.com`. In Vercel:
1. Go to **Settings > Domains**
2. Add `planwedly.com` and `www.planwedly.com`
3. Update your DNS records as instructed

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── admin/              # Admin panel
│   ├── auth/               # Login, signup, OAuth callback
│   ├── budget/             # Budget planner
│   ├── dashboard/          # Couple dashboard
│   ├── events/             # Wedding events manager
│   ├── inquiries/          # Inquiry history
│   ├── onboarding/         # Multi-step onboarding wizard
│   ├── saved/              # Saved vendors
│   ├── tasks/              # Planning tasks
│   ├── vendor/[slug]/      # Individual vendor profile
│   └── vendors/            # Vendor directory & category pages
├── components/
│   ├── layout/             # Navbar, Footer
│   ├── ui/                 # Button, Input, Card
│   └── vendors/            # VendorCard, InquiryForm, etc.
└── lib/
    ├── constants.ts         # App constants
    ├── utils.ts             # Utility functions
    ├── supabase/            # Supabase client (browser, server, middleware)
    └── types/               # TypeScript types (database schema)

supabase/
├── migrations/             # SQL migration files
└── seed.sql                # Vendor seed data (100+ GTA vendors)
```

## Features

### Couples
- Sign up and onboarding (wedding type, date, events, budget)
- Dashboard with countdown, budget progress, tasks, saved vendors
- Budget planner with per-category tracking
- Multi-day event manager
- Task checklist
- Save vendors and send inquiries

### Marketplace
- Browse vendors by category
- Search and filter by city
- Vendor profile pages with contact info and inquiry form
- 100+ pre-seeded GTA Tamil wedding vendors

### Admin
- Vendor management with category filtering
- Category overview
- Inquiry visibility across all couples

## Database

PostgreSQL via Supabase with Row-Level Security (RLS) policies ensuring:
- Couples can only access their own data
- Vendors are publicly readable when published
- Admins have full access

The schema supports future features including:
- Guest list management
- Vendor claiming / self-management
- Reviews and ratings
- Couple wedding websites
- Auspicious date service
- Honeymoon registry

## License

Private — All rights reserved.
