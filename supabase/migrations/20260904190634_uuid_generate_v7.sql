-- A UUIDv7 generator (RFC 9562 §5.7), used as the default for `expenses.id`.
--
-- Why not `gen_random_uuid()`: a v4 is random, so consecutive inserts land in
-- random places in the primary key's B-tree and the index loses locality. A v7
-- begins with the timestamp, so ids generated in sequence sort in that same
-- sequence (10.8) and inserts append instead of scattering.
--
-- Why not the builtin: `uuidv7()` arrived in PostgreSQL 18. This project runs
-- 17 (`supabase/config.toml`), so the function is built here.
--
-- The layout, all offsets 0-based over the 16 bytes:
--
--   bytes 0-5   unix_ts_ms, big endian    48 bits
--   byte  6     0111 (version 7)           4 bits  | high nibble
--               sub-millisecond, high      4 bits  | low nibble
--   byte  7     sub-millisecond, low       8 bits
--   byte  8     10 (variant) + random      8 bits
--   bytes 9-15  random                    56 bits
--
-- The 12 bits after the version hold the sub-millisecond part of the clock
-- rather than random data. RFC 9562 §6.2 calls this "replace leftmost random
-- bits with increased clock precision", and it is what makes two ids generated
-- inside the same millisecond still sort in the order they were generated —
-- without it, `rand_a` is random and their order inside that millisecond is a
-- coin flip. `clock_timestamp()` is microsecond-resolution, so the value is
-- 0..999 and fits the 12 bits with room to spare.
--
-- `clock_timestamp()`, not `now()`: `now()` is the transaction's start time and
-- is identical for every row of a multi-row insert, which would put the whole
-- seed in one millisecond and hand its ordering back to chance.

create or replace function public.uuid_generate_v7()
returns uuid
language plpgsql
volatile
as $$
declare
  micros bigint;
  ms     bigint;
  sub    integer;
  bytes  bytea;
begin
  micros := (extract(epoch from clock_timestamp()) * 1000000)::bigint;
  ms     := micros / 1000;
  sub    := (micros % 1000)::integer;

  -- Start from a random v4: it supplies `rand_b` and, in byte 8, the variant
  -- bits, which are then never touched.
  bytes := uuid_send(gen_random_uuid());

  -- `int8send` is 8 bytes big endian; the low 6 are the millisecond timestamp.
  bytes := overlay(bytes placing substring(int8send(ms) from 3) from 1 for 6);

  -- 112 = 0x70: version 7 in the high nibble, the top 2 bits of `sub` below it.
  bytes := set_byte(bytes, 6, 112 + (sub >> 8));
  bytes := set_byte(bytes, 7, sub & 255);

  return encode(bytes, 'hex')::uuid;
end;
$$;

comment on function public.uuid_generate_v7() is
  'Time-ordered UUID (RFC 9562 v7). Sub-millisecond precision in rand_a keeps ids generated in the same millisecond in order.';
