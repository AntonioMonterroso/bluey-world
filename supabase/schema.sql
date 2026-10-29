-- Bluey World · almacén de sincronización (idempotente: se puede correr varias veces).
-- Una sola tabla genérica: cada fila local (receta, gasto, perfil...) viaja como JSON.
-- La app trabaja siempre contra la base local del dispositivo y sube/baja cambios aquí.

create table if not exists public.records (
  user_id    uuid   not null default auth.uid() references auth.users(id) on delete cascade,
  table_name text   not null,
  id         text   not null,
  data       jsonb  not null default '{}'::jsonb,
  updated_at bigint not null,
  deleted_at bigint,
  primary key (user_id, table_name, id)
);

create index if not exists records_pull_idx on public.records (user_id, updated_at);

alter table public.records enable row level security;

drop policy if exists "records: solo las propias" on public.records;
create policy "records: solo las propias" on public.records
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Si llega un cambio más viejo que el guardado (otro dispositivo con retraso), se ignora.
create or replace function public.records_keep_newest() returns trigger
language plpgsql as $$
begin
  if new.updated_at < old.updated_at then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists records_keep_newest on public.records;
create trigger records_keep_newest before update on public.records
  for each row execute function public.records_keep_newest();
