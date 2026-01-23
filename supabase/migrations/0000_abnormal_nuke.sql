-- ============================================
-- PART 1: NUCLEAR LOCKDOWN - REVOKE EVERYTHING
-- ============================================

-- Remove default privileges from public role
alter default privileges revoke execute on functions from public;
revoke all on schema public from public;

-- Revoke all from anon
revoke all PRIVILEGES on database "postgres" from "anon";
revoke all PRIVILEGES on schema "public" from "anon";
revoke all PRIVILEGES on schema "storage" from "anon";
revoke all PRIVILEGES on all SEQUENCES in schema "public" from "anon";
revoke all PRIVILEGES on all SEQUENCES in schema "storage" from "anon";
revoke all PRIVILEGES on all FUNCTIONS in schema "public" from "anon";
revoke all PRIVILEGES on all FUNCTIONS in schema "storage" from "anon";
revoke all PRIVILEGES on all TABLES in schema "public" from "anon";
revoke all PRIVILEGES on all TABLES in schema "storage" from "anon";

-- Revoke all from authenticated
revoke all PRIVILEGES on database "postgres" from "authenticated";
revoke all PRIVILEGES on schema "public" from "authenticated";
revoke all PRIVILEGES on schema "storage" from "authenticated";
revoke all PRIVILEGES on all SEQUENCES in schema "public" from "authenticated";
revoke all PRIVILEGES on all SEQUENCES in schema "storage" from "authenticated";
revoke all PRIVILEGES on all FUNCTIONS in schema "public" from "authenticated";
revoke all PRIVILEGES on all FUNCTIONS in schema "storage" from "authenticated";
revoke all PRIVILEGES on all TABLES in schema "public" from "authenticated";
revoke all PRIVILEGES on all TABLES in schema "storage" from "authenticated";

-- Revoke all from service_role
revoke all PRIVILEGES on database "postgres" from "service_role";
revoke all PRIVILEGES on schema "public" from "service_role";
revoke all PRIVILEGES on schema "storage" from "service_role";
revoke all PRIVILEGES on all SEQUENCES in schema "public" from "service_role";
revoke all PRIVILEGES on all SEQUENCES in schema "storage" from "service_role";
revoke all PRIVILEGES on all FUNCTIONS in schema "public" from "service_role";
revoke all PRIVILEGES on all FUNCTIONS in schema "storage" from "service_role";
revoke all PRIVILEGES on all TABLES in schema "public" from "service_role";
revoke all PRIVILEGES on all TABLES in schema "storage" from "service_role";

-- Prevent future objects from being accessible by default
alter default privileges in schema public revoke execute on functions from anon, authenticated, service_role;
alter default privileges in schema public revoke all on tables from anon, authenticated, service_role;
alter default privileges in schema public revoke all on sequences from anon, authenticated, service_role;

alter default privileges in schema storage revoke execute on functions from anon, authenticated, service_role;
alter default privileges in schema storage revoke all on tables from anon, authenticated, service_role;
alter default privileges in schema storage revoke all on sequences from anon, authenticated, service_role;

-- ============================================
-- PART 2: GRANT SCHEMA ACCESS
-- ============================================

grant usage on schema public to anon;
grant usage on schema public to authenticated;
grant usage on schema public to service_role;
