# 🛡️ Pactkeeper Web SDK & Player Portal

> **Capstone Project:** SEP490 — Software Engineering, FPT University  
> **Repository:** `VHoangThang2004/SDK_Pactkeeper`  
> **Status:** Active Development & Test Deployment  
> **Production URL:** [https://pactkeeper-web.vercel.app](https://pactkeeper-web.vercel.app)

---

## 📖 1. Overview

The **Pactkeeper Web SDK & Player Portal** is the official web companion platform for the tactical strategy RPG **Pactkeeper (SRPG)**. Designed with an immersive medieval fantasy and parchment aesthetic, the portal provides players and administrators with a secure, responsive, and seamless interface for microtransactions, profile management, and live customer counsel.

### Core Modules:
- **Treasury (Gem Acquisition):** Catalog of gem packages bundled with in-game heroes, weapons, and trinkets, integrated with payment gateways (PayOS).
- **Player Profile:** Live display of adventurer rank, level, experience progression, gem reserves, and dynamic character avatar.
- **Treasury Ledger (Payment History):** Real-time ledger tracking all gem transactions and order states (`CONFIRMED`, `PENDING`, `CANCELLED`).
- **Counsel (Live Realtime Support):** Two-way real-time communication channel powered by Microsoft SignalR, supporting text messaging and image uploads.
- **Keeper's Archives (Admin Console):** Management console for Game Masters and Administrators to review active player counsel scrolls and provide live support.

---

## 🛠️ 2. Tech Stack

| Category | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Core Framework** | React | `19.2.x` | Modern reactive UI component architecture |
| **Language** | TypeScript | `~6.0.x` | Strict type safety and maintainable contracts |
| **Build & Bundler** | Vite | `^8.1.x` | Ultra-fast development server and optimized build |
| **State Management**| Zustand | `^5.0.x` | Lightweight, scalable state management (`authStore`) |
| **Routing** | React Router DOM | `^7.18.x` | Client-side routing with role-based route guards |
| **HTTP Client** | Axios | `^1.18.x` | Interceptor-driven HTTP requests with 401 handling |
| **Realtime Gateway**| Microsoft SignalR Client | `^10.0.x` | WebSockets/SignalR client for real-time live support |
| **Authentication** | `@react-oauth/google` | `^0.13.x` | Secure Google OAuth 2.0 Identity Provider |
| **Icons** | Lucide React | `^1.25.x` | Crisp, medieval-compatible iconography |
| **Linter** | Oxlint | `^1.71.x` | High-speed Rust-based code quality linter |
| **Deployment** | Vercel Serverless / CLI | - | Global Edge CDN with reverse proxy capabilities |

---

## 🏗️ 3. Architecture & Design Principles

The application is engineered using **Clean Architecture** principles to maintain strict separation of concerns, decoupling domain business rules from user interfaces and external third-party SDKs:

```text
src/
├── core/
│   ├── domain/             # Enterprise Business Rules
│   │   ├── entities/       # Domain Models (e.g., User)
│   │   └── repositories/   # Abstract Repository Interfaces (e.g., IAuthRepository)
│   ├── app/                # Application Business Rules
│   │   └── useCases/       # Use Cases (e.g., LoginUseCase, LoginWithGoogleUseCase)
│   ├── infra/              # Infrastructure Layer
│   │   ├── http/           # Axios apiClient instance, interceptors, and API config
│   │   ├── storage/        # LocalStorage persistence service
│   │   └── repositoriesImpl/# Concrete Repository Implementations (e.g., AuthRepositoryImpl)
│   └── network/            # Backward-compatibility facade exports
├── features/               # Feature-Sliced Presentation Modules
│   ├── auth/               # Google OAuth, Admin authentication, and DI Container
│   ├── payment/            # Checkout screen and payment result callback views
│   ├── profile/            # Treasury top-up, ledger, missives, and admin dashboard
│   └── support/            # Real-time SignalR support chat and service
├── components/             # Reusable Design System Widgets (Parchment, Buttons, Inputs)
├── store/                  # Global Zustand Stores
├── styles/                 # Global styles, variables, and Medieval fantasy theme tokens
├── App.tsx                 # Route declarations & role-based authentication guards
└── main.tsx                # Application bootstrap & Google OAuth Provider wrapper
```

---

## 🔒 4. Environment & Security Configuration

To prevent **Reconnaissance & Information Disclosure** vulnerabilities (preventing malicious automated scrapers from mapping private backend IP addresses, DDNS domains, or ports on public Git repositories), sensitive configuration files are strictly excluded via `.gitignore`.

You **must** create the following two configuration files on your local development machine before running or deploying the project.

### 4.1 Creating `.env` (Local Development)

Create a file named `.env` in the root folder of the project (`SDK_Pactkeeper/.env`):

```env
# Google OAuth 2.0 Web Client ID
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com

# Backend Target Host (Used by Vite's development proxy to forward /api and /hubs)
# Replace with your actual backend host or local dev server
VITE_BACKEND_TARGET=http://localhost:5276
```

> **Why this is needed:**  
> During `npm run dev`, Vite reads `VITE_BACKEND_TARGET` to dynamically route `/api/*` and `/hubs/*` requests to your backend without encountering CORS or Mixed Content restrictions.

---

### 4.2 Creating `vercel.json` (Production Deployment)

Create a file named `vercel.json` in the root folder of the project (`SDK_Pactkeeper/vercel.json`):

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "http://your-backend-host:5276/api/:path*"
    },
    {
      "source": "/hubs/:path*",
      "destination": "http://your-backend-host:5276/hubs/:path*"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

> **Why this is needed:**  
> In production, Vercel acts as a secure HTTPS Reverse Proxy. It terminates SSL on `https://pactkeeper-web.vercel.app` and proxies client API calls to the Kestrel backend over HTTP server-to-server. Keeping `vercel.json` in `.gitignore` guarantees that the backend host is never publicly exposed on GitHub.

---

## 🚀 5. Getting Started

### 1. Prerequisites
- **Node.js:** version `18.x` or higher (`node -v`)
- **Package Manager:** `npm` (bundled with Node) or `pnpm` / `yarn`
- **Vercel CLI:** (optional, for production deployments)

### 2. Installation
Clone the repository and install project dependencies:
```bash
git clone https://github.com/VHoangThang2004/SDK_Pactkeeper.git
cd SDK_Pactkeeper
npm install
```

### 3. Setup Gitignored Configuration Files
Follow the instructions in **Section 4** above to create your local `.env` and `vercel.json` files.

### 4. Running the Development Server
Start the local Vite development server:
```bash
npm run dev
```
The application will launch at:  
👉 **`http://localhost:5173`**

### 5. Code Quality & Production Build
Run the fast Rust linter and verify TypeScript compilation:
```bash
# Run Oxlint
npm run lint

# Compile TypeScript and bundle for production
npm run build

# Preview production build locally
npm run preview
```

---

## 🌐 6. Deployment Guide (Vercel CLI)

Because `vercel.json` is intentionally excluded from Git, **do not rely on GitHub automated triggers on Vercel** (which would deploy without proxy rewrite rules). Instead, deploy directly from your local machine using the official **Vercel CLI**.

### Step 1: Install Vercel CLI & Authenticate
```bash
# Install Vercel CLI globally
npm install -g vercel

# Log in to your Vercel account
vercel login
```

### Step 2: Link to Project (One-time only)
Link your local repository to the `pactkeeper-web` project:
```bash
vercel link --yes --project pactkeeper-web
```

### Step 3: Deploy to Production
Deploy your local build and proxy configuration directly to the live environment:
```bash
vercel --prod
```

> [!IMPORTANT]
> **Vercel Dashboard Configuration:**  
> Go to **Vercel Dashboard** ➔ Project **`pactkeeper-web`** ➔ **Settings** ➔ **Git** and ensure automatic deployments from GitHub are paused or disconnected. This prevents GitHub pushes from overwriting your local `vercel.json` proxy rules with an unconfigured build.

---

## 📊 7. Feature Roadmap & Milestone Status

| Subsystem / Feature | Status | Description |
| :--- | :---: | :--- |
| **Google OAuth 2.0 Login** | Completed | Frictionless one-tap authentication for players. |
| **Admin Authentication** | Completed | Secure credentials portal for Game Masters. |
| **Role-Based Routing** | Completed | Strict access barriers for admin and player routes. |
| **Resilience & Fallback Engine** | Completed | Safeguards preventing infinite loading on network dropouts. |
| **Gem Catalog & Item Resolution**| Completed | Dynamic resolution of bundled heroes, weapons, and trinkets. |
| **PayOS Payment Gateway** | Completed | Secure order creation and gateway redirect flow. |
| **Transaction Ledger** | Completed | Full auditing history of past tithes and acquired gems. |
| **System Missives (Mailbox)** | Completed | Inbox for announcements and system status dispatches. |
| **Realtime SignalR Support** | Completed | Bidirectional live chat and image upload capabilities. |
| **Admin Support Console** | Completed | Real-time queue of player counsel tickets. |
| **Zero-Disclosure Deployment** | Completed | Complete elimination of hardcoded backend endpoints from Git. |

---

## 👥 8. Development Team

- **Lead Developer:** Vo Hoang Thang (SE182121)
- **Course:** SEP490 — Capstone Project, Software Engineering
- **Institution:** FPT University
- **Game Project:** SRPG Pactkeeper
