-- Create the profiles table
create table public.profiles (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  location_lat float8 not null,
  location_lng float8 not null,
  met_at text,
  met_on date,
  notes text,
  tags text[] default '{}'::text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;

-- Create policies
-- Allow read access to everyone (or restrict to authenticated users if preferred)
create policy "Allow public read access" on public.profiles
  for select using (true);

-- Allow insert access to everyone (for demo purposes, normally restricted)
create policy "Allow public insert access" on public.profiles
  for insert with check (true);

-- Allow update access
create policy "Allow public update access" on public.profiles
  for update using (true);

