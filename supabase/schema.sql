-- =====================================================================
-- CHITRA SAREE CENTRE — Database schema (Supabase / PostgreSQL)
-- Run this ONCE in Supabase: SQL Editor > New query > paste > Run.
-- Then run seed.sql for categories + demo products.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- USERS (admins). Login accounts live in Supabase Auth (auth.users);
-- passwords are hashed by Supabase. This table marks who is an admin.
-- ---------------------------------------------------------------------
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

-- ---------------------------------------------------------------------
-- CATALOGUE LOOKUPS (all editable from the admin dashboard)
-- ---------------------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.subcategories (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete cascade,
  name text not null,
  slug text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (category_id, slug)
);

create table if not exists public.fabrics (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order int not null default 0
);

create table if not exists public.work_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order int not null default 0
);

-- ---------------------------------------------------------------------
-- PRODUCTS
-- ---------------------------------------------------------------------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 160),
  slug text not null unique,
  sku text not null unique,
  description text not null default '',
  category_id uuid references public.categories(id) on delete set null,
  subcategory_id uuid references public.subcategories(id) on delete set null,
  fabric_id uuid references public.fabrics(id) on delete set null,
  work_type_id uuid references public.work_types(id) on delete set null,
  price numeric(10,2) not null check (price >= 0),
  mrp numeric(10,2) not null check (mrp >= 0),
  stock int not null default 0 check (stock >= 0),
  is_available boolean not null default true,
  is_featured boolean not null default false,
  is_new_arrival boolean not null default false,
  is_best_seller boolean not null default false,
  tags text[] not null default '{}',
  sold_count int not null default 0,
  is_demo boolean not null default false,
  -- Reserved for the future AI Virtual Try-On feature
  tryon_enabled boolean not null default false,
  search_text text not null default '',   -- filled automatically, used by website search
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint price_not_above_mrp check (price <= mrp)
);
create index if not exists products_category_idx on public.products(category_id);
create index if not exists products_created_idx on public.products(created_at desc);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  storage_path text,          -- set when the file lives in Supabase Storage
  is_main boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists product_images_product_idx on public.product_images(product_id);

-- Inventory history: every stock change is recorded here automatically.
create table if not exists public.inventory_movements (
  id bigint generated always as identity primary key,
  product_id uuid not null references public.products(id) on delete cascade,
  change int not null,
  stock_after int not null,
  reason text not null,        -- 'order', 'order_cancelled', 'manual', 'created'
  order_id uuid,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- CUSTOMERS & ORDERS (no card/UPI/bank data is ever stored)
-- ---------------------------------------------------------------------
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null unique,
  email text,
  address text,
  city text,
  state text,
  pincode text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create sequence if not exists public.order_number_seq start 1001;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default ('CSC-' || nextval('public.order_number_seq')),
  public_token uuid not null unique default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete set null,
  customer_name text not null,
  phone text not null,
  email text,
  address text not null,
  city text not null,
  state text not null,
  pincode text not null,
  notes text,
  subtotal numeric(10,2) not null,
  shipping_fee numeric(10,2) not null default 0,
  total numeric(10,2) not null,
  payment_method text not null check (payment_method in ('cod','razorpay','upi')),
  payment_status text not null default 'pending'
    check (payment_status in ('pending','awaiting_verification','paid','failed','refunded')),
  order_status text not null default 'pending'
    check (order_status in ('pending','confirmed','processing','shipped','delivered','cancelled')),
  razorpay_order_id text unique,
  razorpay_payment_id text,
  upi_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists orders_created_idx on public.orders(created_at desc);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  sku text,
  image_url text,
  unit_price numeric(10,2) not null,
  quantity int not null check (quantity > 0),
  line_total numeric(10,2) not null
);
create index if not exists order_items_order_idx on public.order_items(order_id);

-- ---------------------------------------------------------------------
-- BUSINESS SETTINGS (single row, editable in Admin > Settings)
-- ---------------------------------------------------------------------
create table if not exists public.settings (
  id int primary key default 1 check (id = 1),
  business_name text not null default 'Chitra Saree Centre',
  tagline text default 'Tradition. Elegance. You.',
  phone_primary text default '9888821306',
  phone_secondary text default '6283251254',
  whatsapp_number text default '6283251254',
  email text default 'harman6283251254@gmail.com',
  maps_url text default 'https://maps.app.goo.gl/Gk8WSs1r3jWBtUtB8',
  store_address text,
  store_hours text,
  store_description text default 'Chitra Saree Centre brings you sarees, suits, lehengas, shararas, ghararas and kurta pajamas for weddings, parties and every celebration in between.',
  logo_url text default '/logo.jpg',
  instagram_url text default 'https://www.instagram.com/chitrasareecentre/',
  facebook_url text,
  youtube_url text,
  return_policy text,
  shipping_policy text,
  shipping_fee numeric(10,2) not null default 0,
  free_shipping_above numeric(10,2),
  cod_enabled boolean not null default true,
  upi_enabled boolean not null default true,
  upi_id text default 'harman6283251254@okicici',
  upi_payee_name text default 'Harman Arora',
  upi_qr_url text default '/upi-qr.jpg',
  low_stock_threshold int not null default 3,
  updated_at timestamptz not null default now()
);
insert into public.settings (id) values (1) on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- SOCIAL MEDIA
-- ---------------------------------------------------------------------
create table if not exists public.notification_log (
  id bigint generated always as identity primary key,
  channel text not null default 'whatsapp',
  order_id uuid references public.orders(id) on delete set null,
  recipient text not null,
  template text not null,
  status text not null,        -- 'sent', 'demo', 'failed'
  detail text,
  created_at timestamptz not null default now()
);

create table if not exists public.instagram_posts (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete set null,
  image_url text,
  caption text not null,
  status text not null default 'draft' check (status in ('draft','published','failed')),
  ig_media_id text,
  error text,
  created_at timestamptz not null default now(),
  published_at timestamptz
);

-- ---------------------------------------------------------------------
-- TRIGGERS
-- ---------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

drop trigger if exists products_touch on public.products;
create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();
drop trigger if exists orders_touch on public.orders;
create trigger orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();
drop trigger if exists settings_touch on public.settings;
create trigger settings_touch before update on public.settings
  for each row execute function public.touch_updated_at();

-- Keep the search text up to date (name, code, tags, category, fabric, work)
create or replace function public.build_search_text()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.search_text := lower(concat_ws(' ', new.name, new.sku, new.description, array_to_string(new.tags, ' '),
    (select name from categories where id = new.category_id),
    (select name from subcategories where id = new.subcategory_id),
    (select name from fabrics where id = new.fabric_id),
    (select name from work_types where id = new.work_type_id)));
  return new;
end $$;
drop trigger if exists products_search_text on public.products;
create trigger products_search_text before insert or update on public.products
  for each row execute function public.build_search_text();

-- Record manual stock changes made by the admin
create or replace function public.log_manual_stock()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into inventory_movements(product_id, change, stock_after, reason)
    values (new.id, new.stock, new.stock, 'created');
  elsif new.stock is distinct from old.stock
        and coalesce(current_setting('csc.stock_reason', true), '') = '' then
    insert into inventory_movements(product_id, change, stock_after, reason)
    values (new.id, new.stock - old.stock, new.stock, 'manual');
  end if;
  return new;
end $$;
drop trigger if exists products_stock_log on public.products;
create trigger products_stock_log after insert or update of stock on public.products
  for each row execute function public.log_manual_stock();

-- When an order is cancelled, put its items back into stock (once).
create or replace function public.handle_order_status()
returns trigger language plpgsql security definer set search_path = public as $$
declare it record;
begin
  if old.order_status = 'cancelled' and new.order_status <> 'cancelled' then
    raise exception 'A cancelled order cannot be reopened. Please create a new order instead.';
  end if;
  if new.order_status = 'cancelled' and old.order_status <> 'cancelled' then
    perform set_config('csc.stock_reason', 'order_cancelled', true);
    for it in select product_id, quantity from order_items where order_id = new.id and product_id is not null loop
      update products
         set stock = stock + it.quantity,
             sold_count = greatest(sold_count - it.quantity, 0)
       where id = it.product_id;
      insert into inventory_movements(product_id, change, stock_after, reason, order_id)
      select id, it.quantity, stock, 'order_cancelled', new.id from products where id = it.product_id;
    end loop;
    perform set_config('csc.stock_reason', '', true);
  end if;
  return new;
end $$;
drop trigger if exists orders_status_change on public.orders;
create trigger orders_status_change before update of order_status on public.orders
  for each row execute function public.handle_order_status();

-- ---------------------------------------------------------------------
-- PLACE ORDER — prices and stock are read from the database, never
-- trusted from the browser. Runs atomically; stock is locked per row.
-- Only the server (service role) may call this.
-- ---------------------------------------------------------------------
create or replace function public.place_order(p jsonb)
returns table (order_id uuid, order_number text, public_token uuid, total numeric)
language plpgsql security definer set search_path = public as $$
declare
  v_customer uuid;
  v_order uuid;
  v_subtotal numeric(10,2) := 0;
  v_ship numeric(10,2) := 0;
  v_set settings%rowtype;
  it jsonb;
  pr record;
  v_qty int;
  v_img text;
  v_method text := p->>'payment_method';
begin
  if jsonb_typeof(p->'items') <> 'array' or jsonb_array_length(p->'items') = 0 then
    raise exception 'CART_EMPTY';
  end if;
  if jsonb_array_length(p->'items') > 50 then
    raise exception 'CART_TOO_LARGE';
  end if;
  select * into v_set from settings where id = 1;
  if v_method = 'cod' and not v_set.cod_enabled then raise exception 'METHOD_DISABLED'; end if;
  if v_method = 'upi' and not v_set.upi_enabled then raise exception 'METHOD_DISABLED'; end if;

  insert into customers(name, phone, email, address, city, state, pincode)
  values (p->>'name', p->>'phone', nullif(p->>'email',''), p->>'address', p->>'city', p->>'state', p->>'pincode')
  on conflict (phone) do update set
    name = excluded.name, email = coalesce(excluded.email, customers.email),
    address = excluded.address, city = excluded.city, state = excluded.state,
    pincode = excluded.pincode, updated_at = now()
  returning id into v_customer;

  insert into orders(customer_id, customer_name, phone, email, address, city, state, pincode, notes,
                     subtotal, shipping_fee, total, payment_method, payment_status)
  values (v_customer, p->>'name', p->>'phone', nullif(p->>'email',''), p->>'address', p->>'city',
          p->>'state', p->>'pincode', nullif(p->>'notes',''), 0, 0, 0, v_method,
          case when v_method = 'upi' then 'awaiting_verification' else 'pending' end)
  returning id into v_order;

  perform set_config('csc.stock_reason', 'order', true);
  for it in select * from jsonb_array_elements(p->'items') loop
    v_qty := (it->>'quantity')::int;
    if v_qty is null or v_qty < 1 or v_qty > 20 then raise exception 'BAD_QUANTITY'; end if;

    select * into pr from products where id = (it->>'product_id')::uuid for update;
    if not found then raise exception 'PRODUCT_NOT_FOUND'; end if;
    if not pr.is_available or pr.stock < v_qty then
      raise exception 'OUT_OF_STOCK:%', pr.name;
    end if;

    select url into v_img from product_images where product_id = pr.id
      order by is_main desc, sort_order asc limit 1;

    insert into order_items(order_id, product_id, product_name, sku, image_url, unit_price, quantity, line_total)
    values (v_order, pr.id, pr.name, pr.sku, v_img, pr.price, v_qty, pr.price * v_qty);

    update products set stock = stock - v_qty, sold_count = sold_count + v_qty where id = pr.id;
    insert into inventory_movements(product_id, change, stock_after, reason, order_id)
    values (pr.id, -v_qty, pr.stock - v_qty, 'order', v_order);

    v_subtotal := v_subtotal + pr.price * v_qty;
  end loop;
  perform set_config('csc.stock_reason', '', true);

  v_ship := coalesce(v_set.shipping_fee, 0);
  if v_set.free_shipping_above is not null and v_subtotal >= v_set.free_shipping_above then
    v_ship := 0;
  end if;

  update orders set subtotal = v_subtotal, shipping_fee = v_ship, total = v_subtotal + v_ship
   where id = v_order;

  return query select o.id, o.order_number, o.public_token, o.total from orders o where o.id = v_order;
end $$;

revoke all on function public.place_order(jsonb) from public, anon, authenticated;
grant execute on function public.place_order(jsonb) to service_role;

-- ---------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- Public visitors: read catalogue + settings only.
-- Admins: full control. Orders/customers: admins only (the server
-- uses the secret service key to create orders).
-- ---------------------------------------------------------------------
alter table public.admin_users enable row level security;
alter table public.categories enable row level security;
alter table public.subcategories enable row level security;
alter table public.fabrics enable row level security;
alter table public.work_types enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.settings enable row level security;
alter table public.notification_log enable row level security;
alter table public.instagram_posts enable row level security;

drop policy if exists "admin reads own row" on public.admin_users;
create policy "admin reads own row" on public.admin_users for select to authenticated
  using (user_id = auth.uid());

do $$
declare t text;
begin
  foreach t in array array['categories','subcategories','fabrics','work_types','products','product_images','settings'] loop
    execute format('drop policy if exists "public read" on public.%I', t);
    execute format('create policy "public read" on public.%I for select to anon, authenticated using (true)', t);
  end loop;
  foreach t in array array['categories','subcategories','fabrics','work_types','products','product_images',
                           'inventory_movements','customers','orders','order_items','notification_log','instagram_posts'] loop
    execute format('drop policy if exists "admin all" on public.%I', t);
    execute format('create policy "admin all" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

drop policy if exists "admin update settings" on public.settings;
create policy "admin update settings" on public.settings for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Admins may change order status/payment status, but not rewrite totals.
revoke update on public.orders from authenticated;
grant update (order_status, payment_status, notes) on public.orders to authenticated;

-- ---------------------------------------------------------------------
-- IMAGE STORAGE — public read, admin-only upload. Only images, max 5 MB.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists "product images public read" on storage.objects;
create policy "product images public read" on storage.objects for select
  using (bucket_id = 'product-images');
drop policy if exists "product images admin insert" on storage.objects;
create policy "product images admin insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and public.is_admin());
drop policy if exists "product images admin update" on storage.objects;
create policy "product images admin update" on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and public.is_admin());
drop policy if exists "product images admin delete" on storage.objects;
create policy "product images admin delete" on storage.objects for delete to authenticated
  using (bucket_id = 'product-images' and public.is_admin());
