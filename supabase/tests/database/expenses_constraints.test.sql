begin;
select plan(13);

insert into auth.users (id, instance_id, aud, role, email)
values ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'caro@example.com');

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}', true);

-- Amount: whole pesos here, but stored exactly (10.1) and never zero (10.4).
select throws_ok(
  $$insert into public.expenses (amount, category_id, date) values (0, 'otros', '2026-09-01')$$,
  '23514', null, 'an amount of zero is rejected (10.4)'
);
select throws_ok(
  $$insert into public.expenses (amount, category_id, date) values (-5, 'otros', '2026-09-01')$$,
  '23514', null, 'a negative amount is rejected (10.4)'
);

-- Exactness: numeric, not float. 0.1 + 0.2 is the canonical float failure.
insert into public.expenses (amount, category_id, date) values (0.1, 'otros', '2026-09-01');
insert into public.expenses (amount, category_id, date) values (0.2, 'otros', '2026-09-01');
select is(
  (select sum(amount) from public.expenses where date = '2026-09-01'),
  0.3::numeric,
  'amounts sum exactly, with no floating-point drift (10.1)'
);

-- Currency defaults, and is the only one this version writes (10.2, 10.3).
select is(
  (select distinct currency from public.expenses),
  'COP',
  'currency defaults to COP (10.2)'
);

-- Description: absent is absent, blank is refused (10.5).
select lives_ok(
  $$insert into public.expenses (amount, category_id, date, description)
    values (100, 'otros', '2026-09-02', null)$$,
  'a null description is accepted (10.5)'
);
select throws_ok(
  $$insert into public.expenses (amount, category_id, date, description)
    values (100, 'otros', '2026-09-02', '   ')$$,
  '23514', null, 'a blank description is rejected (10.5)'
);
select throws_ok(
  $$insert into public.expenses (amount, category_id, date, description)
    values (100, 'otros', '2026-09-02', '')$$,
  '23514', null, 'an empty description is rejected (10.5)'
);

-- Category is text, unconstrained on purpose (11.1). The database is not where
-- the five values are enforced; the code is.
select lives_ok(
  $$insert into public.expenses (amount, category_id, date)
    values (100, 'cripto', '2026-09-02')$$,
  'an unknown category is accepted by the database (11.1)'
);

-- Date is a calendar date, and no timezone moves it (10.6).
insert into public.expenses (amount, category_id, date)
values (700, 'mercado', '2026-01-01');
select is(
  (select to_char(date, 'YYYY-MM-DD') from public.expenses where amount = 700),
  '2026-01-01',
  'a date round-trips as the same calendar day (10.6)'
);

-- updated_at moves on update; created_at does not (10.7).
insert into public.expenses (id, amount, category_id, date)
values ('44444444-4444-4444-4444-444444444444', 900, 'otros', '2026-09-05');
update public.expenses set amount = 950
where id = '44444444-4444-4444-4444-444444444444';
select ok(
  (select updated_at > created_at from public.expenses
   where id = '44444444-4444-4444-4444-444444444444'),
  'an update moves updated_at past created_at (10.7)'
);

-- Rows written by one multi-row insert still get distinct created_at values, so
-- the order of expenses within a day is defined (1.3). With `now()` as the
-- default they would all share the transaction's start time and this would be 1.
insert into public.expenses (amount, category_id, date) values
  (10, 'otros', '2026-07-01'), (20, 'otros', '2026-07-01'), (30, 'otros', '2026-07-01');
select is(
  (select count(distinct created_at)::int from public.expenses where date = '2026-07-01'),
  3,
  'rows inserted in one statement get distinct created_at values (1.3)'
);

-- The idempotency key: the same one twice is one row, two different ones for an
-- identical draft are two rows (5.8).
insert into public.expenses (amount, category_id, date, client_op_id)
values (1000, 'otros', '2026-09-06', '55555555-5555-5555-5555-555555555555');
select throws_ok(
  $$insert into public.expenses (amount, category_id, date, client_op_id)
    values (1000, 'otros', '2026-09-06', '55555555-5555-5555-5555-555555555555')$$,
  '23505', null, 'the same client_op_id cannot be inserted twice (5.7)'
);
select lives_ok(
  $$insert into public.expenses (amount, category_id, date, client_op_id)
    values (1000, 'otros', '2026-09-06', '66666666-6666-6666-6666-666666666666')$$,
  'an identical expense with a different client_op_id is a second expense (5.8)'
);

reset role;
select * from finish();
rollback;
