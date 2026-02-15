-- Explicit grants for all tables with RLS policies
-- Organized by permission level rather than role

-- Account tables
grant select, insert, update, delete on table public.accounts to authenticated, service_role;
grant select, insert, update, delete on table public.team_members to authenticated, service_role;

-- Lead management tables
grant select, insert, update on table public.leads to authenticated, service_role;
grant delete on table public.leads to service_role;
grant select, insert on table public.lead_activities to authenticated, service_role;
grant update, delete on table public.lead_activities to service_role;
grant select, insert, update, delete on table public.lead_notes to authenticated, service_role;
grant select, insert, update, delete on table public.lead_reminders to authenticated, service_role;

-- Message tables
grant select, insert on table public.messages to authenticated, service_role;
grant update, delete on table public.messages to service_role;
grant select, insert, update, delete on table public.message_templates to authenticated, service_role;
grant select on table public.template_variables to authenticated, service_role;
grant insert, update, delete on table public.template_variables to service_role;

-- Credit system tables
grant select, insert, update on table public.credit_balances to authenticated, service_role;
grant delete on table public.credit_balances to service_role;
grant select on table public.credit_transactions to authenticated, service_role;
grant insert, update, delete on table public.credit_transactions to service_role;
grant select on table public.credit_packs to authenticated, service_role;
grant insert, update, delete on table public.credit_packs to service_role;

-- Hunt/filter tables
grant select, insert, update, delete on table public.hunts to authenticated, service_role;
grant select, insert, update, delete on table public.sub_types_hunts to authenticated, service_role;
grant select, insert, update, delete on table public.brands_hunts to authenticated, service_role;

-- Ad tables
grant select on table public.ads to authenticated, service_role;
grant insert, update, delete on table public.ads to service_role;
grant select, insert, update on table public.contacted_ads to authenticated, service_role;
grant delete on table public.contacted_ads to service_role;
grant select on table public.ad_types to authenticated, service_role;
grant insert, update, delete on table public.ad_types to service_role;
grant select on table public.sub_types to authenticated, service_role;
grant insert, update, delete on table public.sub_types to service_role;

-- Vehicle attribute tables (read-only for authenticated, full access for service_role)
grant select on table public.driving_licences to authenticated, service_role;
grant insert, update, delete on table public.driving_licences to service_role;
grant select on table public.gear_boxes to authenticated, service_role;
grant insert, update, delete on table public.gear_boxes to service_role;
grant select on table public.vehicle_seats to authenticated, service_role;
grant insert, update, delete on table public.vehicle_seats to service_role;
grant select on table public.vehicle_states to authenticated, service_role;
grant insert, update, delete on table public.vehicle_states to service_role;
grant select on table public.brands to authenticated, service_role;
grant insert, update, delete on table public.brands to service_role;
grant select on table public.fuels to authenticated, service_role;
grant insert, update, delete on table public.fuels to service_role;
grant select on table public.locations to authenticated, service_role;
grant insert, update, delete on table public.locations to service_role;

-- App settings (service_role only)
grant select, insert, update, delete on table public.app_settings to service_role;

-- Channel and hunt credits
grant select, insert, update, delete on table public.channel_priorities to service_role;
grant select, insert, update, delete on table public.hunt_channel_credits to authenticated, service_role;

-- WhatsApp sessions
grant select, insert, update, delete on table public.whatsapp_sessions to authenticated, service_role;