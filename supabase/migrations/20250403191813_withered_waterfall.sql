/*
  # Add profiles table

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `name` (text)
      - `affiliation` (text)
      - `research_interests` (text)
      - `updated_at` (timestamp with time zone)

  2. Security
    - Enable RLS on `profiles` table
    - Add policies for authenticated users to manage their own profile
*/

create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  name text,
  affiliation text,
  research_interests text,
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

-- Create policies
create policy "Users can view any profile"
  on profiles for select
  to public
  using (true);

create policy "Users can update their own profile"
  on profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users can insert their own profile"
  on profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- Create a trigger to update the updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger handle_profiles_updated_at
  before update on profiles
  for each row
  execute procedure handle_updated_at();

-- Create a trigger to create a profile after user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();