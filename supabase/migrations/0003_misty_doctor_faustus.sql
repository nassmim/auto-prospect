-- Explicit grants for all tables with RLS policies
-- Organization tables
grant select, insert, update, delete on table public.organizations to authenticated, service_role;
grant select, insert, update, delete on table public.organization_members to authenticated, service_role;
grant select, insert, update, delete on table public.organization_invitations to authenticated, service_role;

-- Lead management tables
grant select, insert, update, delete on table public.leads to authenticated, service_role;
grant select, insert, update, delete on table public.lead_notes to authenticated, service_role;
grant select, insert, update, delete on table public.lead_reminders to authenticated, service_role;
grant select, insert, update, delete on table public.lead_activities to authenticated, service_role;

-- Message tables
grant select, insert, update, delete on table public.messages to authenticated, service_role;
grant select, insert, update, delete on table public.message_templates to authenticated, service_role;
grant select on table public.message_types to authenticated;
grant select, insert, update, delete on table public.message_types to service_role;
grant select on table public.template_variables to authenticated;
grant select, insert, update, delete on table public.template_variables to service_role;

-- Credit system tables
grant select, insert, update, delete on table public.credit_balances to authenticated, service_role;
grant select, insert, update, delete on table public.credit_transactions to authenticated, service_role;

-- Hunt/filter tables
grant select, insert, update, delete on table public.base_filters to authenticated, service_role;
grant select, insert, update, delete on table public.ad_sub_types_filter to authenticated, service_role;
grant select, insert, update, delete on table public.brands_filter to authenticated, service_role;

-- Ad tables
grant select, insert, update, delete on table public.ads to authenticated, service_role;
grant select, insert, update, delete on table public.contacted_ads to authenticated, service_role;
grant select on table public.ad_types to authenticated;
grant select, insert, update, delete on table public.ad_types to service_role;
grant select on table public.sub_types to authenticated;
grant select, insert, update, delete on table public.sub_types to service_role;

-- Vehicle attribute tables (read-only for authenticated users, full access for service_role)
grant select on table public.driving_licences to authenticated;
grant select, insert, update, delete on table public.driving_licences to service_role;
grant select on table public.gear_boxes to authenticated;
grant select, insert, update, delete on table public.gear_boxes to service_role;
grant select on table public.vehicle_seats to authenticated;
grant select, insert, update, delete on table public.vehicle_seats to service_role;
grant select on table public.vehicle_states to authenticated;
grant select, insert, update, delete on table public.vehicle_states to service_role;
grant select on table public.brands to authenticated;
grant select, insert, update, delete on table public.brands to service_role;
grant select on table public.fuels to authenticated;
grant select, insert, update, delete on table public.fuels to service_role;
grant select on table public.locations to authenticated;
grant select, insert, update, delete on table public.locations to service_role;

-- App settings (service_role only)
grant select, insert, update, delete on table public.app_settings to service_role;