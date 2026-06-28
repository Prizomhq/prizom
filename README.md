# Prizom — Collaborative AI Prompt Registry

Prizom is a next-generation, high-performance collaborative registry for AI prompt engineering. It allows creators, engineers, and AI enthusiasts to publish, discover, save, bookmark, and remix advanced AI prompt templates (Midjourney, ChatGPT, Stable Diffusion, etc.) with premium visual aesthetics and deep analytics.

---

## 🚀 Key Features

* **High-Fidelity Visual Feed**: Fully responsive masonry grid layout with fluid hover animations and lazy-loaded image optimization.
* **Branded Security System**: Completely custom-styled modal dialogs replacing standard browser notifications and alerts.
* **Unified Auth & Guest Controls**: Safe gating on social actions (like, save, follow, remix, report) with instant, beautiful login required prompts.
* **Lineage & Version Tracking**: Track the history of prompts. Build prompt remixes (forks) with automatic parent-descendant linkage.
* **Realtime System Alerts**: Dynamic global toast system and websockets-based user notification dropdowns.
* **Moderation Controls**: Safe and secure user blocking, safety appeal flows, content flagging, and admin oversight.
* **Security & Infrastructure Auditing**: Automated database RLS protection, Turnstile validation, and endpoint rate limiting.

---

## 🛠️ Technology Stack

* **Framework**: Next.js 15 (App Router, Server Actions, Server Components)
* **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Framer Motion
* **Backend & Database**: Supabase (PostgreSQL, Realtime, SSR SDK, RLS)
* **Image CDN**: Cloudinary (Dynamic responsive resizing and delivery)
* **Email Provider**: Resend (Transactional transactional notifications)
* **Bot Mitigation**: Cloudflare Turnstile

---

## 📂 Folder Structure

```text
src/
├── app/                  # Next.js App Router Pages, API routes, Server Actions
│   ├── actions/          # Database & utility server actions (auth, DB, moderation)
│   ├── admin/            # Administrative dashboard and user management pages
│   ├── creator/          # Public creator profiles, tabs, and analytics dashboard
│   ├── discover/         # Prompt discovery feed, global search, and filtering
│   ├── prompt/           # Prompt detail views, comments, and action panels
│   └── settings/         # User settings, preferences, and profile configuration
├── components/           # Reusable React components
│   ├── analytics/        # Guest/user tracking and behavior tracking scripts
│   ├── explore/          # Exploration modules and client search feeds
│   ├── layout/           # Base Navbar, Footer, and layout structures
│   ├── shared/           # OnboardingWizard, CookieBanner, and ConsentGuard
│   └── ui/               # Core atomic components (Avatar, CopyButton, DynamicDialog)
├── lib/                  # Helper classes and clients (Supabase, Resend, Cloudinary)
└── middleware.ts         # Global server middleware for account lifecycle & protection
```

---

## 💻 Local Development

### 1. Prerequisites
* Node.js v20+
* Git
* Supabase Account / Local database instance

### 2. Environment Setup
Create a `.env.local` file in the root directory (based on `.env` template):
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=notifications@yourdomain.com

CRON_SECRET=your_cron_cleanup_secret
NEXT_PUBLIC_SITE_URL=http://localhost:3000

NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_turnstile_site_key
TURNSTILE_SECRET_KEY=your_turnstile_secret_key
```

### 3. Run Development Server
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the development build.

### 4. Build for Production
```bash
npm run build
npm run start
```

---

## 🔀 Branching Strategy

Prizom enforces a strict branch workflow to prevent unstable code from reaching production:

* **`develop`**: The active development branch. All daily updates, features, and fixes are merged here. This is the default branch on GitHub.
* **`main`**: The production-ready stable branch. Releases are merged here from `develop` after testing. Vercel deployment on `prizom.in` tracks this branch.

---

## 📄 License
Private code repository. All rights reserved by Prizom.
