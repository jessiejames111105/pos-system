import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project-url.supabase.co'
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY || 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * SQL Schema Suggestion for Supabase:
 * 
 * -- Categories table
 * create table categories (
 *   id uuid default uuid_generate_v4() primary key,
 *   name text not null unique,
 *   created_at timestamp with time zone default timezone('utc'::text, now())
 * );
 * 
 * -- Products table
 * create table products (
 *   id uuid default uuid_generate_v4() primary key,
 *   category_id uuid references categories(id) on delete set null,
 *   name text not null,
 *   description text,
 *   image_url text,
 *   created_at timestamp with time zone default timezone('utc'::text, now())
 * );
 * 
 * -- Product sizes and prices
 * create table product_sizes (
 *   id uuid default uuid_generate_v4() primary key,
 *   product_id uuid references products(id) on delete cascade,
 *   size_name text not null, -- e.g. Small, Medium, Large
 *   price decimal(10,2) not null
 * );
 * 
 * -- Product ingredients
 * create table product_ingredients (
 *   id uuid default uuid_generate_v4() primary key,
 *   product_id uuid references products(id) on delete cascade,
 *   ingredient_name text not null,
 *   quantity decimal(10,2) not null,
 *   unit text not null -- e.g. g, ml, pcs
 * );
 * 
 * -- Product add-ons
 * create table product_addons (
 *   id uuid default uuid_generate_v4() primary key,
 *   product_id uuid references products(id) on delete cascade,
 *   name text not null,
 *   price decimal(10,2) not null
 * );
 * 
 * -- Orders table
 * create table orders (
 *   id uuid default uuid_generate_v4() primary key,
 *   total_amount decimal(10,2) not null,
 *   status text default 'pending', -- pending, completed, cancelled
 *   payment_method text,
 *   created_at timestamp with time zone default timezone('utc'::text, now())
 * );
 * 
 * -- Order items table
 * create table order_items (
 *   id uuid default uuid_generate_v4() primary key,
 *   order_id uuid references orders(id) on delete cascade,
 *   product_id uuid references products(id),
 *   quantity integer not null,
 *   unit_price decimal(10,2) not null,
 *   subtotal decimal(10,2) not null
 * );
 */
