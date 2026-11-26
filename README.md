# GYD – Get Your Designer

**Tagline:** *Your Occasion. Your Style. Your Designer.*  
**Value Proposition:** *Don't Guess Your Style. Get Your Designer.*

A complete, responsive, multi-vendor service marketplace connecting customers with verified fashion stylists, bridal couturiers, makeup artists, event scenographers, interior consultants, gift curators, and photoshoot stylists across India.

## Three Connected Experiences

1. **Customer Website & Dashboard (`/`, `/explore`, `/categories`, `/designers/[id]`, `/book/[designerId]`, `/customer/*`)**
   - Editorial landing experience, dynamic category & subcategory directory, multi-filter designer discovery, rich portfolio profiles, 9-step guided booking workflow with conflict-free slot locking, Razorpay sandbox prep, wishlist, studio messaging, and invoice downloads.
2. **Designer Studio (`/become-a-designer`, `/designer/*`)**
   - Multi-step designer onboarding & verification submission, studio KPIs & charts, booking acceptance/rejection/alt-slot pipeline, service & multi-package CRUD, portfolio gallery manager, slot & blocked-date availability calendar, and transparent commission & payout ledger.
3. **Admin Console (`/admin/*`)**
   - Platform overview KPIs & charts, customer account management, designer verification & approval queue, dynamic category & subcategory builder (create, edit, disable, reorder, commission %), booking dispute controls, payment & refund moderation, commission overrides & demo payouts, review moderation, CMS editor, and platform settings + audit log.

## Brand Design System

Centralized CSS design tokens in `app/globals.css`:
- Deep Plum (`#35233D`)
- Vibrant Coral (`#F07865`)
- Soft Lavender (`#E8DDF0`)
- Lavender Mist (`#F7F4F8`)
- Charcoal (`#25212A`)
- Pure White (`#FFFFFF`)
- Muted Mauve (`#9C829F`)
- Soft Pink (`#F5E6E9`)
- Light (default) & Dark themes with persistent preference.
- Typography: `Playfair Display` (editorial headings) + `Manrope` (UI, navigation, forms, dashboards).

## Demo Credentials (Frontend Mode)

Open `/login` or use any portal switcher pill:
- **Customer Demo:** `customer.demo@gyd.in`
- **Designer Demo:** `designer.demo@gyd.in`
- **Admin Demo:** `admin.demo@gyd.in`

> Note: Payments, refunds, payouts, and sample testimonials are clearly marked as demonstration/sandbox data and never fake production transactions.

## Local Setup

```bash
npm install
cp .env.example .env.local
# Add your MongoDB Atlas password to MONGODB_URI in .env.local, then seed Atlas:
npm run seed:mongodb
npm run dev
```

## Production Build Verification

```bash
npx tsc --noEmit
npm run lint
npm run build
```

## Backend Integration (MongoDB Atlas + API Routes)

- `lib/db/mongodb.ts`, `lib/db/collections.ts`, `lib/db/seed.ts`, and `lib/db/marketplace-sync.ts` connect GYD to MongoDB Atlas (with automatic first-boot seeding and incremental document sync across all 21 marketplace collections + `platform_config`).
- `scripts/seed-mongodb.ts` (`npm run seed:mongodb`) seeds/resets all collections & creates indexes in Atlas.
- API route handlers under `app/api/` provide health checks (`/api/health`), unified store sync (`/api/marketplace`), designer/category/user/booking endpoints, restricted Admin auth (`/api/admin/auth`), places search (`/api/places/search`), and HMAC-verified Razorpay webhook scaffolding.
- Security headers & `/admin/*` cookie gating are configured in `proxy.ts`.
