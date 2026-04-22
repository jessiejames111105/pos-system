# POS System with React & Supabase

A flexible, responsive Point of Sale (POS) system designed for Web, Desktop, and Mobile.

## Features

- **Dashboard**: Real-time business metrics and recent sales overview.
- **POS Interface**: Fast product catalog browsing, search, and cart management.
- **Responsive Design**: 
  - **Desktop**: Persistent sidebar for navigation.
  - **Mobile**: Bottom navigation bar and optimized touch-friendly interface.
- **Checkout Flow**: Support for multiple payment methods with a smooth modal experience.
- **Backend Ready**: Pre-configured with Supabase (PostgreSQL) integration.

## Tech Stack

- **Frontend**: React.js 19
- **Styling**: Tailwind CSS v4 (with Vite plugin)
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Navigation**: React Router 7
- **Database/Auth**: Supabase

## Setup Instructions

### 1. Environment Variables
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 2. Supabase Database Schema
Run the SQL in [supabase_schema.sql](file:///c:/Users/Admin/Documents/POS/supabase_schema.sql) in your Supabase SQL Editor.
 
Notes:
- “Materials” (cups, lids, straws, containers) are stored in the `ingredients` table using unit `pcs` (or `pc/piece/pieces`). The UI groups them as Materials.

### 3. Installation
```bash
npm install
```

### 4. Development
```bash
npm run dev
```

## Local + Online

- Local development: keep `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env.local`.
- Deployment (Vercel/Netlify/etc): set the same environment variables in the hosting provider dashboard.

## Project Structure

- `src/components`: Reusable UI components (Layout, Sidebar, Navbar).
- `src/pages`: Main application views (Dashboard, POS).
- `src/store`: Global state management (Cart, User).
- `src/lib`: Third-party service initializations (Supabase).
