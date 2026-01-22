-- Custom SQL migration file, put your code below! --

-- Add missing grants for reference data tables (migration 0003)
grant select, insert, update, delete on table public.sub_types to authenticated, service_role;
grant select, insert, update, delete on table public.ad_types to authenticated, service_role;
grant select, insert, update, delete on table public.brands to authenticated, service_role;
grant select, insert, update, delete on table public.driving_licences to authenticated, service_role;
grant select, insert, update, delete on table public.fuels to authenticated, service_role;
grant select, insert, update, delete on table public.gear_boxes to authenticated, service_role;
grant select, insert, update, delete on table public.vehicle_seats to authenticated, service_role;
grant select, insert, update, delete on table public.vehicle_states to authenticated, service_role;
grant select, insert, update, delete on table public.locations to authenticated, service_role;

-- Add missing grants for ads table (migration 0003)
grant select, insert, update, delete on table public.ads to authenticated, service_role;

-- Add missing grants for filter tables (migration 0005)
grant select, insert, update, delete on table public.ad_sub_types_filter to authenticated, service_role;
grant select, insert, update, delete on table public.brands_filter to authenticated, service_role;

-- Add missing grants for contacted_ads and settings tables (migration 0007)
grant select, insert, update, delete on table public.contacted_ads to authenticated, service_role;
grant select, insert, update, delete on table public.app_settings to authenticated, service_role;
grant select, insert, update, delete on table public.message_types to authenticated, service_role;