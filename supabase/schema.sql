-- =============================================================
-- Invenlux — esquema Postgres para Supabase
-- Espejo de apps/movil/src/datos/esquema.ts (SQLite local).
-- Pégalo entero en Supabase → SQL Editor → New query → Run.
-- =============================================================

create extension if not exists "pgcrypto"; -- gen_random_uuid()

create table hogar (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null,
  zona_horaria  text not null default 'Europe/Madrid',
  dias_aviso    integer not null default 3,
  estrategia    text not null default 'FEFO' check (estrategia in ('FEFO','FIFO','LIFO')),
  creado_en     timestamptz not null default now()
);

create table producto (
  id           uuid primary key default gen_random_uuid(),
  hogar_id     uuid not null references hogar(id) on delete cascade,
  nombre       text not null,
  categoria    text not null,
  unidad       text not null check (unidad in ('unidades','g','kg','ml','l')),
  stock_min    numeric not null default 0,
  auto_compra  boolean not null default true,
  creado_en    timestamptz not null default now()
);

create table lote (
  id                uuid primary key default gen_random_uuid(),
  producto_id       uuid not null references producto(id) on delete cascade,
  cantidad_inicial  numeric not null,
  f_compra          date not null,
  f_caducidad       date,
  ubicacion         text not null check (ubicacion in ('Nevera','Congelador','Despensa')),
  precio            numeric,
  origen            text not null default 'manual' check (origen in ('manual','barcode','ticket','email')),
  creado_en         timestamptz not null default now()
);

-- Registro inmutable: sólo INSERT desde la app. Corregir es un movimiento
-- de tipo 'ajuste', nunca un UPDATE sobre una fila existente.
create table movimiento (
  id           uuid primary key default gen_random_uuid(),
  lote_id      uuid not null references lote(id) on delete cascade,
  producto_id  uuid not null references producto(id) on delete cascade,
  tipo         text not null check (tipo in ('entrada','consumo','merma','ajuste')),
  cantidad     numeric not null,
  fecha        timestamptz not null default now(),
  usuario_id   uuid references auth.users(id)
);

create table lista_compra (
  id           uuid primary key default gen_random_uuid(),
  hogar_id     uuid not null references hogar(id) on delete cascade,
  texto        text not null,
  producto_id  uuid references producto(id) on delete set null,
  origen       text not null check (origen in ('manual','agotado','stock-minimo')),
  comprado     boolean not null default false,
  creado_en    timestamptz not null default now()
);

create index idx_producto_hogar   on producto(hogar_id);
create index idx_lote_producto    on lote(producto_id);
create index idx_mov_lote         on movimiento(lote_id);
create index idx_mov_producto     on movimiento(producto_id);
create index idx_lista_hogar      on lista_compra(hogar_id);

-- =============================================================
-- Multi-hogar: quién pertenece a qué hogar.
-- Necesaria para que las políticas de RLS de abajo tengan sentido.
-- =============================================================
create table miembro_hogar (
  hogar_id    uuid not null references hogar(id) on delete cascade,
  usuario_id  uuid not null references auth.users(id) on delete cascade,
  rol         text not null default 'admin' check (rol in ('admin','colaborador','lectura')),
  primary key (hogar_id, usuario_id)
);

-- =============================================================
-- RLS — cada usuario sólo ve los datos de los hogares a los que pertenece.
-- =============================================================
alter table hogar         enable row level security;
alter table producto      enable row level security;
alter table lote          enable row level security;
alter table movimiento    enable row level security;
alter table lista_compra  enable row level security;
alter table miembro_hogar enable row level security;

create policy "ver mis hogares" on hogar
  for select using (
    id in (select hogar_id from miembro_hogar where usuario_id = auth.uid())
  );

create policy "gestionar mis hogares" on hogar
  for update using (
    id in (select hogar_id from miembro_hogar where usuario_id = auth.uid() and rol = 'admin')
  );

create policy "leer mi hogar" on miembro_hogar
  for select using (usuario_id = auth.uid());

create policy "productos de mi hogar" on producto
  for all using (
    hogar_id in (select hogar_id from miembro_hogar where usuario_id = auth.uid())
  );

create policy "lotes de mi hogar" on lote
  for all using (
    producto_id in (
      select p.id from producto p
      join miembro_hogar m on m.hogar_id = p.hogar_id
      where m.usuario_id = auth.uid()
    )
  );

create policy "movimientos de mi hogar" on movimiento
  for all using (
    producto_id in (
      select p.id from producto p
      join miembro_hogar m on m.hogar_id = p.hogar_id
      where m.usuario_id = auth.uid()
    )
  );

create policy "lista de mi hogar" on lista_compra
  for all using (
    hogar_id in (select hogar_id from miembro_hogar where usuario_id = auth.uid())
  );

-- =============================================================
-- Al registrarse un usuario nuevo, se le crea un hogar propio y se le
-- añade como admin. Así el alta en la app no necesita un paso aparte.
-- =============================================================
create or replace function crear_hogar_para_usuario_nuevo()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  nuevo_hogar_id uuid;
begin
  insert into hogar (nombre) values ('Mi casa') returning id into nuevo_hogar_id;
  insert into miembro_hogar (hogar_id, usuario_id, rol) values (nuevo_hogar_id, new.id, 'admin');
  return new;
end;
$$;

create trigger al_registrarse
  after insert on auth.users
  for each row execute function crear_hogar_para_usuario_nuevo();
