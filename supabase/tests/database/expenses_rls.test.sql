begin;
select plan(12);

-- Two accounts. `auth.users` is written directly because signing in is not what
-- is under test here; ownership is (Requirement 2).
insert into auth.users (id, instance_id, aud, role, email)
values
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ana@example.com'),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'beto@example.com');

-- Impersonating an account means the `authenticated` role plus the JWT claims
-- that `auth.uid()` reads. Both are needed: the role is what RLS applies to,
-- the claims are what the policies compare against.
create or replace function pg_temp.become(who uuid) returns void
language plpgsql as $$
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', who, 'role', 'authenticated')::text, true);
end;
$$;

create or replace function pg_temp.become_owner() returns void
language plpgsql as $$
begin
  perform set_config('role', 'postgres', true);
  perform set_config('request.jwt.claims', '', true);
end;
$$;

-- RLS is on at all (2.4): without this every policy below is decoration.
select ok(
  (select relrowsecurity from pg_class where oid = 'public.expenses'::regclass),
  'row level security is enabled on expenses'
);

-- RLS says which rows; a grant says whether the role may reach the table at
-- all. Both are needed, and the failure mode of forgetting the grant is a
-- "permission denied" that looks nothing like a policy problem.
select ok(
  has_table_privilege('authenticated', 'public.expenses', 'select')
  and has_table_privilege('authenticated', 'public.expenses', 'insert')
  and has_table_privilege('authenticated', 'public.expenses', 'update')
  and has_table_privilege('authenticated', 'public.expenses', 'delete'),
  'the authenticated role is granted the four operations'
);

-- And the anonymous role is granted none of them: without a session there is no
-- expense figure at all (2.5).
select ok(
  not has_table_privilege('anon', 'public.expenses', 'select')
  and not has_table_privilege('anon', 'public.expenses', 'insert'),
  'the anon role can reach nothing (2.5)'
);

-- Ana writes two expenses without naming a user_id (2.1).
select pg_temp.become('11111111-1111-1111-1111-111111111111');
insert into public.expenses (amount, category_id, date)
values (10000, 'mercado', '2026-09-01'), (20000, 'transporte', '2026-09-02');

select is(
  (select count(*)::int from public.expenses),
  2,
  'an insert that names no user_id is attributed to the caller'
);

select is(
  (select count(distinct user_id)::int from public.expenses
   where user_id = '11111111-1111-1111-1111-111111111111'),
  1,
  'the rows belong to the account that wrote them (2.1)'
);

-- Beto writes one of his own.
select pg_temp.become('22222222-2222-2222-2222-222222222222');
insert into public.expenses (amount, category_id, date) values (55000, 'otros', '2026-09-03');

select is(
  (select count(*)::int from public.expenses),
  1,
  'each account reads only its own expenses (2.2)'
);

select is(
  (select amount from public.expenses),
  55000::numeric(14,2),
  'and the row it reads is its own'
);

-- Beto cannot reach Ana's rows, in any direction (2.3).
with attempted as (
  update public.expenses set amount = 1
  where user_id = '11111111-1111-1111-1111-111111111111'
  returning 1
)
select is((select count(*)::int from attempted), 0, 'an update against another account touches no row (2.3)');

with attempted as (
  delete from public.expenses
  where user_id = '11111111-1111-1111-1111-111111111111'
  returning 1
)
select is((select count(*)::int from attempted), 0, 'a delete against another account touches no row (2.3)');

-- Nor can he forge one into her account.
select throws_ok(
  $$insert into public.expenses (user_id, amount, category_id, date)
    values ('11111111-1111-1111-1111-111111111111', 999, 'otros', '2026-09-04')$$,
  '42501',
  null,
  'an insert bearing another account''s user_id is rejected (2.3)'
);

-- Ana's rows are intact after all of that.
select pg_temp.become('11111111-1111-1111-1111-111111111111');
select is(
  (select count(*)::int from public.expenses),
  2,
  'the other account''s attempts changed nothing'
);

-- A soft-deleted row is still the owner's row; hiding it is the reader's job,
-- not RLS's (6.10).
update public.expenses set deleted_at = now() where amount = 10000;
select is(
  (select count(*)::int from public.expenses where deleted_at is not null),
  1,
  'a soft-deleted row survives and stays readable to its owner (6.10)'
);

select pg_temp.become_owner();
select * from finish();
rollback;
