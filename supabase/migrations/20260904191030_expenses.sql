-- The one table this product has: an expense, belonging to exactly one account.
--
-- There is no `categories` table (the five values live in the code, 11.1), no
-- `months` table and no stored totals — every figure in the header is derived
-- from these rows by pure functions, so none of them can go stale.

create table public.expenses (
  id           uuid primary key default public.uuid_generate_v7(),

  -- The default is what lets a client insert without naming itself; the foreign
  -- key is what makes deleting an account take its expenses with it.
  user_id      uuid not null default auth.uid()
                 references auth.users (id) on delete cascade,

  -- `numeric`, not `float`: money is summed, and binary floating point does not
  -- sum decimal fractions exactly (10.1). Every amount this version writes is a
  -- whole peso, but the type is what keeps that a fact rather than a hope.
  amount       numeric(14,2) not null check (amount > 0),

  -- Stored so the schema need not change the day a second currency appears;
  -- this version only ever writes 'COP' (10.2, 10.3).
  currency     text not null default 'COP',

  -- Deliberately unconstrained: no enum, no check (11.1). The five known values
  -- are enforced by the application, and an unknown one read back is presented
  -- as "Otros" rather than breaking the book (11.3).
  category_id  text not null,

  -- Absent is absent, never blank (10.5). The check is what makes that an
  -- invariant of the data instead of a habit of the current client.
  description  text check (description is null or length(btrim(description)) > 0),

  -- `date`, not `timestamptz`: the day the user chose is a calendar day, and no
  -- timezone may move an expense out of it (10.6).
  date         date not null,

  -- `clock_timestamp()`, not `now()`: `now()` is the transaction's start time and
  -- is identical for every row of a multi-row insert. The order of expenses
  -- within a day derives from `created_at` (1.3), so a seed of 37 rows written
  -- in one transaction would have no defined order at all.
  created_at   timestamptz not null default clock_timestamp(),
  updated_at   timestamptz not null default clock_timestamp(),

  -- Soft deletion (6.10). The row survives so undo can restore it, and so that
  -- closing the tab during the undo window still leaves the deletion final.
  deleted_at   timestamptz,

  -- One value per confirmation, reused by every retry of it (5.8). Null for the
  -- rows the seed trigger writes, which no client ever retries.
  client_op_id uuid
);

-- The read path is always "this account, this month and the one before, not
-- deleted", which is exactly this index.
create index expenses_user_date_idx
  on public.expenses (user_id, date desc)
  where deleted_at is null;

-- What makes a retry idempotent (5.7): the second insert of the same
-- confirmation collides here instead of creating a second expense. Partial, so
-- the seed's null keys do not compete for it.
create unique index expenses_client_op_id_idx
  on public.expenses (user_id, client_op_id)
  where client_op_id is not null;

alter table public.expenses enable row level security;

-- RLS decides WHICH rows a role may touch; it does not grant the right to touch
-- the table at all. A table created by a migration starts with no privileges for
-- the API roles, so without this every request fails with "permission denied"
-- even though the policies above are correct.
--
-- `authenticated` only. `anon` is deliberately not granted anything: without a
-- session there must be no expense figure of any kind (2.5).
grant select, insert, update, delete on public.expenses to authenticated;

-- Ownership is enforced here and nowhere else (2.4). The queries the app sends
-- never name a user_id: a second place to state this rule is a second place for
-- it to be wrong.
--
-- `(select auth.uid())` rather than `auth.uid()`: the subquery is evaluated once
-- per statement, the bare call once per row.
create policy expenses_select on public.expenses
  for select using (user_id = (select auth.uid()));

create policy expenses_insert on public.expenses
  for insert with check (user_id = (select auth.uid()));

create policy expenses_update on public.expenses
  for update using (user_id = (select auth.uid()))
           with check (user_id = (select auth.uid()));

create policy expenses_delete on public.expenses
  for delete using (user_id = (select auth.uid()));

-- 10.7 asks when a row last changed. A default alone cannot answer that: it
-- fires on insert and never again.
--
-- `clock_timestamp()` for the same reason as above, and one more: with `now()`
-- an update issued in the same transaction as the insert would write back the
-- transaction's start time, leaving `updated_at` equal to `created_at` on a row
-- that demonstrably changed.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := clock_timestamp();
  return new;
end;
$$;

create trigger expenses_set_updated_at
  before update on public.expenses
  for each row execute function public.set_updated_at();
