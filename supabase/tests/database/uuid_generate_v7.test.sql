begin;
select plan(7);

-- The function exists at all.
select has_function('public', 'uuid_generate_v7', 'uuid_generate_v7() is defined');

-- Character 15 of the canonical text form is the version nibble. A v4 with a
-- timestamp glued on top would sort correctly and still be mislabelled, so this
-- is asserted rather than assumed (10.8).
select is(
  substring(public.uuid_generate_v7()::text from 15 for 1),
  '7',
  'the version nibble is 7'
);

-- Character 20 is the variant nibble: RFC 9562 requires 10xx, i.e. 8, 9, a or b.
select ok(
  substring(public.uuid_generate_v7()::text from 20 for 1) in ('8', '9', 'a', 'b'),
  'the variant bits are 10xx'
);

-- The embedded timestamp is the real clock, not an arbitrary counter: the first
-- 48 bits, read as milliseconds, land within ten seconds of now().
select ok(
  abs(
    extract(epoch from now()) * 1000
    - ('x' || substring(replace(public.uuid_generate_v7()::text, '-', '') from 1 for 12))::bit(48)::bigint
  ) < 10000,
  'the leading 48 bits are the current unix time in milliseconds'
);

-- Ordering across milliseconds. The rows are inserted one at a time with a real
-- pause between them; `pg_sleep` returns void and so cannot be a column.
create temporary table ordered_ids (i integer, id uuid);
do $$
begin
  for k in 1..12 loop
    insert into ordered_ids values (k, public.uuid_generate_v7());
    perform pg_sleep(0.002);
  end loop;
end;
$$;

select is(
  (select count(*)::int from ordered_ids a join ordered_ids b on a.i < b.i and a.id >= b.id),
  0,
  'ids generated milliseconds apart sort in the order they were generated'
);

-- Ordering WITHIN a millisecond. This is what the sub-millisecond bits buy: with
-- a random rand_a these 500 ids would interleave at random inside each
-- millisecond and this count would be far from zero.
create temporary table burst_ids as
select i, public.uuid_generate_v7() as id
from generate_series(1, 500) as i;

select is(
  (select count(*)::int from burst_ids a join burst_ids b on a.i < b.i and a.id >= b.id),
  0,
  'ids generated in a tight burst still sort in the order they were generated'
);

-- And they are still unique.
select is(
  (select count(distinct id)::int from burst_ids),
  500,
  '500 ids generated in a burst are all distinct'
);

select * from finish();
rollback;
