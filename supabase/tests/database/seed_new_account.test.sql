begin;
select plan(11);

-- An ordinary account, created in a 30-day month.
insert into auth.users (id, instance_id, aud, role, email, created_at)
values ('aaaaaaaa-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000',
        'authenticated', 'authenticated', 'nueva@example.com', '2026-09-15 10:00:00+00');

select is(
  (select count(*)::int from public.expenses where user_id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  37,
  'a new account is seeded with the whole book (8.1)'
);

select is(
  (select count(distinct to_char(date, 'YYYY-MM'))::int
   from public.expenses where user_id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  2,
  'the seeded book spans exactly two months (8.2)'
);

select is(
  (select to_char(max(date), 'YYYY-MM') from public.expenses
   where user_id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  '2026-09',
  'the later month is the month the account was created in (8.2)'
);

select is(
  (select to_char(min(date), 'YYYY-MM') from public.expenses
   where user_id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  '2026-08',
  'the earlier month is the one before it (8.2)'
);

-- The figure the mockup shows under "MES ANTERIOR", still exact after the
-- template made its dates relative.
select is(
  (select sum(amount) from public.expenses
   where user_id = 'aaaaaaaa-0000-0000-0000-000000000001'
     and to_char(date, 'YYYY-MM') = '2026-08'),
  1412300::numeric,
  'the previous month totals what the mockup shows (8.3)'
);

-- Seeded rows are ordinary rows: owned, not deleted, in COP, and none of them
-- carries an idempotency key (8.4).
select is(
  (select count(*)::int from public.expenses
   where user_id = 'aaaaaaaa-0000-0000-0000-000000000001'
     and (deleted_at is not null or currency <> 'COP' or client_op_id is not null)),
  0,
  'seeded expenses are indistinguishable from recorded ones (8.4)'
);

-- Within a day, created_at orders the rows (1.3).
select is(
  (select count(distinct created_at)::int from public.expenses
   where user_id = 'aaaaaaaa-0000-0000-0000-000000000001'
     and date = '2026-09-03'),
  3,
  'the three rows of one day get three distinct created_at values (1.3)'
);

-- The month-length clamp. March's previous month is February, and the template
-- contains a day 31 and a day 29-30; none of them may produce an invalid date.
insert into auth.users (id, instance_id, aud, role, email, created_at)
values ('aaaaaaaa-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000',
        'authenticated', 'authenticated', 'marzo@example.com', '2026-03-15 10:00:00+00');

select is(
  (select count(*)::int from public.expenses where user_id = 'aaaaaaaa-0000-0000-0000-000000000002'),
  37,
  'an account created in March is seeded in full, February notwithstanding'
);

select is(
  (select count(*)::int from public.expenses
   where user_id = 'aaaaaaaa-0000-0000-0000-000000000002'
     and to_char(date, 'YYYY-MM') not in ('2026-02', '2026-03')),
  0,
  'every clamped date stays inside its intended month'
);

-- 2026 is not a leap year, so February has 28 days and the template's 29th,
-- 30th and 31st all land on the 28th.
select is(
  (select max(extract(day from date))::int from public.expenses
   where user_id = 'aaaaaaaa-0000-0000-0000-000000000002'
     and to_char(date, 'YYYY-MM') = '2026-02'),
  28,
  'a day the month does not have is clamped to its last day'
);

-- 8.7: a user row that predates this feature has no expenses. Deleting the
-- trigger reproduces "created before the migration existed".
drop trigger seed_new_account_trigger on auth.users;
insert into auth.users (id, instance_id, aud, role, email, created_at)
values ('aaaaaaaa-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000',
        'authenticated', 'authenticated', 'vieja@example.com', '2026-01-01 10:00:00+00');

select is(
  (select count(*)::int from public.expenses where user_id = 'aaaaaaaa-0000-0000-0000-000000000003'),
  0,
  'an account that predates the feature opens an empty book (8.7)'
);

select * from finish();
rollback;
