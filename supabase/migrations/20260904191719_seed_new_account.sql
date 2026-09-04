-- The book a new account wakes up with (Requirement 8).
--
-- Why a trigger on `auth.users` rather than a seed on first sign-in:
--
--   * it fires exactly once per account, inside the transaction that creates it,
--     which is 8.5 with no marker column and no race between two tabs signing in
--     at the same instant;
--   * it never runs for an account that already exists, which is 8.7 for free —
--     accounts created before this migration simply open an empty book;
--   * a failure inside its `exception` block rolls back only the seed, because
--     the block is a subtransaction. The account is still created and the person
--     still signs in (8.6).
--
-- `security definer` because the role that inserts into `auth.users` is not the
-- one that may write `public.expenses`. `search_path` is pinned, which is the
-- standard precaution for a definer function.
--
-- The 37 rows below are rendered from `SEED_TEMPLATE` in `lib/seed.ts`; a vitest
-- assertion compares `renderSeedValues()` against this file, so the two cannot
-- drift apart. They carry offsets, not dates: 0 is the month the account was
-- created in and -1 the month before (8.2).

create or replace function public.seed_new_account()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  creation_month date;
begin
  creation_month := date_trunc('month', coalesce(new.created_at, now()))::date;

  insert into public.expenses
    (user_id, amount, category_id, description, date, created_at, updated_at)
  select
    new.id,
    t.amount,
    t.category_id,
    t.description::text,
    target.day_date,
    target.day_date + (t.seq * interval '1 second'),
    target.day_date + (t.seq * interval '1 second')
  from (values
    (-1, 1, 132400, 'mercado', 'Éxito Poblado', 0),
    (-1, 2, 38900, 'restaurantes', 'Crepes & Waffles', 0),
    (-1, 3, 20000, 'transporte', 'Recarga Cívica', 0),
    (-1, 4, 87600, 'mercado', 'Carulla Oviedo', 0),
    (-1, 5, 26900, 'suscripciones', 'Netflix', 0),
    (-1, 6, 15600, 'restaurantes', 'Café Velvet', 0),
    (-1, 7, 22000, 'otros', null, 0),
    (-1, 8, 96300, 'mercado', 'La Mayorista', 0),
    (-1, 9, 34500, 'restaurantes', 'Salón Málaga', 0),
    (-1, 10, 14200, 'transporte', 'Uber a la oficina', 0),
    (-1, 11, 41200, 'mercado', 'D1 Laureles', 0),
    (-1, 12, 52000, 'restaurantes', 'Mondongo''s', 0),
    (-1, 14, 16900, 'suscripciones', 'Spotify Premium', 0),
    (-1, 15, 118700, 'mercado', 'Carulla Oviedo', 0),
    (-1, 16, 18300, 'transporte', 'Uber al centro', 0),
    (-1, 17, 45000, 'transporte', 'Taxi al aeropuerto', 0),
    (-1, 18, 16800, 'restaurantes', 'Café Velvet', 0),
    (-1, 19, 63800, 'otros', 'Farmacia Cruz Verde', 0),
    (-1, 21, 28400, 'restaurantes', 'Al Alma', 0),
    (-1, 22, 89900, 'suscripciones', 'Claro Hogar', 0),
    (-1, 23, 74500, 'mercado', 'D1 Laureles', 0),
    (-1, 24, 45000, 'otros', 'Regalo cumpleaños', 0),
    (-1, 25, 13800, 'transporte', 'Uber a la oficina', 0),
    (-1, 26, 12900, 'suscripciones', 'iCloud', 0),
    (-1, 27, 16600, 'mercado', 'Éxito Poblado', 0),
    (-1, 28, 61200, 'restaurantes', 'Bao Bar', 0),
    (-1, 29, 143900, 'mercado', 'Éxito Poblado', 0),
    (-1, 30, 45000, 'otros', 'Peluquería', 0),
    (-1, 31, 20000, 'transporte', 'Recarga Cívica', 0),
    (0, 1, 63400, 'mercado', 'La Mayorista', 1),
    (0, 1, 16900, 'suscripciones', 'Spotify Premium', 0),
    (0, 2, 26900, 'suscripciones', 'Netflix', 2),
    (0, 2, 42300, 'restaurantes', 'Crepes & Waffles', 1),
    (0, 2, 20000, 'transporte', 'Recarga Cívica', 0),
    (0, 3, 48500, 'mercado', 'Éxito Poblado', 2),
    (0, 3, 12000, 'transporte', 'Uber a la oficina', 1),
    (0, 3, 18900, 'restaurantes', 'Café Velvet', 0)
  ) as t(month_offset, day, amount, category_id, description, seq)
  cross join lateral (
    select (creation_month + (t.month_offset || ' month')::interval)::date as month_start
  ) m
  cross join lateral (
    select (
      m.month_start
      -- A day the target month does not have — the 31st of a 30-day month, or
      -- the 29th of a February — is clamped to that month's last day. Without
      -- this an account created in March would get an invalid date for February.
      + (least(
           t.day,
           extract(day from (m.month_start + interval '1 month' - interval '1 day'))::int
         ) - 1) * interval '1 day'
    )::date as day_date
  ) target;

  return new;
exception
  when others then
    -- A broken seed must never cost anyone their account (8.6). This block is a
    -- subtransaction: the inserts above roll back, the user row does not.
    raise warning 'seed_new_account failed for %: %', new.id, sqlerrm;
    return new;
end;
$$;

create trigger seed_new_account_trigger
  after insert on auth.users
  for each row execute function public.seed_new_account();
