-- Custom migration: Grants and seed data for channel_priorities table
-- Related to Drizzle migration: 0008_omniscient_prowler.sql

-- Grant permissions for authenticated and service_role users
grant select on table public.channel_priorities to authenticated, service_role;

-- Only service_role can insert/update/delete (admin-controlled)
grant insert, update, delete on table public.channel_priorities to service_role;

-- Seed default channel priorities per PRD
-- Lower priority number = tried first
-- Default order: Ringless Voice (1), WhatsApp (2), SMS (3)
insert into public.channel_priorities (channel, priority) values
  ('ringlessVoice', 1),
  ('whatsappText', 2),
  ('sms', 3)
on conflict (channel) do nothing;