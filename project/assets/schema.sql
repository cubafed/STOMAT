-- ============================================================
-- Радикс — схема базы данных (Supabase / PostgreSQL)
-- Модель: один проект, много клиник. Изоляция через RLS по clinic_id
-- из профиля текущего пользователя. Данные приложения хранятся в KV-таблице
-- (ключ rdx_* → значение jsonb), которую зеркалит RadixStore на клиенте.
-- Выполнить целиком в Supabase → SQL Editor → Run.
-- ============================================================

create table if not exists clinics (
  id          uuid primary key default gen_random_uuid(),
  name        text not null default 'Моя клиника',
  city        text,
  created_at  timestamptz default now()
);

create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  clinic_id   uuid references clinics(id) on delete cascade,
  name        text,
  role        text default 'doc',          -- doc | admin | assist
  created_at  timestamptz default now()
);

-- clinic_id текущего пользователя
create or replace function current_clinic_id()
returns uuid language sql stable security definer set search_path = public as $$
  select clinic_id from profiles where id = auth.uid()
$$;

-- KV-хранилище данных клиники (пациенты, планы, оплаты, CRM, перио, склад, настройки)
create table if not exists kv (
  clinic_id uuid not null default current_clinic_id(),
  key       text not null,
  value     jsonb,
  updated_at timestamptz default now(),
  primary key (clinic_id, key)
);

-- Публичные онлайн-заявки с сайта записи (без авторизации)
create table if not exists public_bookings (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid references clinics(id) on delete cascade,
  data jsonb not null default '{}',
  created_at timestamptz default now()
);

-- ---------- RLS ----------
alter table clinics enable row level security;
alter table profiles enable row level security;
alter table kv enable row level security;
alter table public_bookings enable row level security;

create policy "own profile" on profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

create policy "own clinic" on clinics
  for all using (id = current_clinic_id()) with check (id = current_clinic_id());

create policy "clinic kv" on kv
  for all using (clinic_id = current_clinic_id())
  with check (clinic_id = current_clinic_id());

-- заявки: член клиники читает свои; кто угодно (anon) может оставить заявку
create policy "clinic read bookings" on public_bookings
  for select using (clinic_id = current_clinic_id());
create policy "anon insert booking" on public_bookings
  for insert to anon, authenticated with check (true);

-- ---------- Триггер: клиника + профиль при регистрации ----------
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare new_clinic uuid;
begin
  insert into clinics (name, city)
    values (coalesce(new.raw_user_meta_data->>'clinic', 'Моя клиника'),
            new.raw_user_meta_data->>'city')
    returning id into new_clinic;
  insert into profiles (id, clinic_id, name, role)
    values (new.id, new_clinic,
            coalesce(new.raw_user_meta_data->>'name', new.email),
            coalesce(new.raw_user_meta_data->>'role', 'doc'));
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
