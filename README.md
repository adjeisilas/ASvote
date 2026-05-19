# ASVote - Professional Voting & Ticketing Platform

A full-stack, secure, and modern voting and ticketing explorer built with React 19, Vite 6, and Tailwind CSS v4.

## 🚀 Features

- **Event Management**: Create and explore high-stakes voting and ticketing events.
- **Secure Handling**: Real-world payment integration (Paystack) and email notifications (EmailJS/Resend).
- **Modern UI**: Polished design using Tailwind v4 and Motion.
- **Fast Performance**: Optimized build pipeline with Vite and Esbuild.
- **Scalable Architecture**: Internal load balancing (Cluster), Response Caching, and CDN optimizations.

## 🛠 Tech Stack

- **Frontend**: React 19, Vite 6, Tailwind CSS v4, Motion, Lucide Icons, Recharts.
- **Backend**: Node.js Express, Supabase (Database/Auth), Resend (Transactional Email).
- **Dev Tools**: TypeScript 5.x, TSX, ESLint, Prettier.

## 🏁 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18.x or later recommended)
- [npm](https://www.npmjs.com/) (installed with Node)

### 2. Installation
```bash
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory and add your credentials:
```env
# Backend Keys
PAYSTACK_SECRET_KEY=your_paystack_key
RESEND_API_KEY=your_resend_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_key

# Frontend Keys (Prefix with VITE_)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_PAYSTACK_PUBLIC_KEY=your_paystack_public_key
VITE_EMAILJS_SERVICE_ID=your_emailjs_service
VITE_EMAILJS_TEMPLATE_ID=your_emailjs_template
VITE_EMAILJS_PUBLIC_KEY=your_emailjs_public_key
GEMINI_API_KEY=your_gemini_key
```

### 4. Development
Launch the project in development mode (Express + Vite):
```bash
npm run dev
```

### 5. Production Build
Optimize the project for deployment:
```bash
npm run build
npm start
```

## 📂 Project Structure

- `src/`: React frontend components and pages.
- `server.ts`: Express backend entry point.
- `dist/`: Compressed production assets (generated after build).
- `.vscode/`: Workspace settings for a polished VS Code experience.

---

Built with ❤️ for ASVote Global.
