begin;
select plan(2);

-- 8.6: a broken seed must not block sign-in. The `exception` block inside
-- `seed_new_account` is a subtransaction, so its inserts roll back while the
-- `auth.users` row survives.
--
-- The failure is forced by making the insert impossible: a check that no amount
-- can satisfy. This is the only way to exercise the exception path, and it is
-- worth exercising — 8.6 is a promise about the worst day, and an untested
-- `exception` block is a guess.
-- `not valid` so the constraint applies to new rows without being checked
-- against the ones already stored. Without it this file only passes on an empty
-- database: adding a check that existing rows violate is rejected outright, and
-- the test would fail for a reason that has nothing to do with what it asserts.
alter table public.expenses
  add constraint expenses_seed_break check (amount < 0) not valid;

insert into auth.users (id, instance_id, aud, role, email, created_at)
values ('bbbbbbbb-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000',
        'authenticated', 'authenticated', 'rota@example.com', '2026-09-15 10:00:00+00');

select is(
  (select count(*)::int from auth.users where id = 'bbbbbbbb-0000-0000-0000-000000000001'),
  1,
  'the account is created even though its seed failed (8.6)'
);

select is(
  (select count(*)::int from public.expenses where user_id = 'bbbbbbbb-0000-0000-0000-000000000001'),
  0,
  'and it simply opens an empty book'
);

alter table public.expenses drop constraint expenses_seed_break;

select * from finish();
rollback;
