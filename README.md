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
Run the following SQL in your Supabase SQL Editor:

```sql
-- Categories table
create table categories (
  id uuid default uuid_generate_v4() primary key,
  name text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Products table
create table products (
  id uuid default uuid_generate_v4() primary key,
  category_id uuid references categories(id) on delete set null,
  name text not null,
  description text,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Product sizes and prices
create table product_sizes (
  id uuid default uuid_generate_v4() primary key,
  product_id uuid references products(id) on delete cascade,
  size_name text not null,
  price decimal(10,2) not null
);

-- Product ingredients
create table product_ingredients (
  id uuid default uuid_generate_v4() primary key,
  product_id uuid references products(id) on delete cascade,
  ingredient_name text not null,
  quantity decimal(10,2) not null,
  unit text not null
);

-- Product add-ons
create table product_addons (
  id uuid default uuid_generate_v4() primary key,
  product_id uuid references products(id) on delete cascade,
  name text not null,
  price decimal(10,2) not null
);

-- Orders table
create table orders (
  id uuid default uuid_generate_v4() primary key,
  total_amount decimal(10,2) not null,
  status text default 'pending',
  payment_method text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Order items table
create table order_items (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references orders(id) on delete cascade,
  product_id uuid references products(id),
  quantity integer not null,
  unit_price decimal(10,2) not null,
  subtotal decimal(10,2) not null
);
```

### 3. Installation
```bash
npm install
```

### 4. Development
```bash
npm run dev
```

## Project Structure

- `src/components`: Reusable UI components (Layout, Sidebar, Navbar).
- `src/pages`: Main application views (Dashboard, POS).
- `src/store`: Global state management (Cart, User).
- `src/lib`: Third-party service initializations (Supabase).
