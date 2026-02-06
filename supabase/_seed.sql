--
-- PostgreSQL database seed file for auto-prospect
-- This file contains seed data for the database
--

-- Set configuration
SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Seed Data
--

-- Test user account UUID (matches a test auth user)
-- In your development, create a real auth user and use their UUID here
-- For testing, we'll use a fixed UUID
DO $$
DECLARE
  test_account_id uuid := '6315c10b-d205-4c72-a511-6792a4cfdeea';
  test_team_member_id uuid := '550e8400-e29b-41d4-a716-446655440001';
  test_hunt_id uuid := '550e8400-e29b-41d4-a716-446655440010';
  test_location_id int;
  test_ad_type_id smallint;
  test_ad_subtype_id smallint;
  test_brand_id smallint;
  test_fuel_id smallint;
  test_gear_box_id smallint;
  test_ad_id_1 uuid := '550e8400-e29b-41d4-a716-446655440020';
  test_ad_id_2 uuid := '550e8400-e29b-41d4-a716-446655440021';
  test_lead_id_1 uuid := '550e8400-e29b-41d4-a716-446655440030';
  test_lead_id_2 uuid := '550e8400-e29b-41d4-a716-446655440031';
  test_template_id uuid := '550e8400-e29b-41d4-a716-446655440040';
BEGIN

  -- ============================================================
  -- 1. ACCOUNT & TEAM
  -- ============================================================

  -- Update the account created by the trigger (don't insert, the trigger already created it)
  UPDATE public.accounts
  SET
    name = 'Test User Account',
    phone_number = '+33612345678'
  WHERE id = test_account_id;

  INSERT INTO public.team_members (id, account_id, name)
  VALUES (
    test_team_member_id,
    test_account_id,
    'Jean Dupont'
  ) ON CONFLICT (id) DO NOTHING;

  -- ============================================================
  -- 2. REFERENCE DATA (Ad attributes)
  -- ============================================================

  -- Ad Types
  INSERT INTO public.ad_types (name, lbc_value, lobstr_value) VALUES
    ('Voitures', 'voitures', 'car'),
    ('Motos', 'motos', 'motorcycle'),
    ('Utilitaires', 'utilitaires', 'van')
  ON CONFLICT (name) DO NOTHING;

  SELECT id INTO test_ad_type_id FROM public.ad_types WHERE name = 'Voitures' LIMIT 1;

  -- Ad SubTypes
  INSERT INTO public.sub_types (ad_type_id, name, lbc_value, lobstr_value) VALUES
    (test_ad_type_id, 'Berline', 'berline', 'sedan'),
    (test_ad_type_id, 'SUV', 'suv', 'suv'),
    (test_ad_type_id, 'Break', 'break', 'wagon'),
    (test_ad_type_id, 'Citadine', 'citadine', 'compact')
  ON CONFLICT (name) DO NOTHING;

  SELECT id INTO test_ad_subtype_id FROM public.sub_types WHERE name = 'Berline' LIMIT 1;

  -- Brands
  INSERT INTO public.brands (name, lbc_value, lobstr_value) VALUES
    ('Renault', 'renault', 'renault'),
    ('Peugeot', 'peugeot', 'peugeot'),
    ('Citroën', 'citroen', 'citroen'),
    ('Volkswagen', 'volkswagen', 'volkswagen'),
    ('BMW', 'bmw', 'bmw'),
    ('Mercedes', 'mercedes', 'mercedes')
  ON CONFLICT (name) DO NOTHING;

  SELECT id INTO test_brand_id FROM public.brands WHERE name = 'Renault' LIMIT 1;

  -- Fuels
  INSERT INTO public.fuels (name, lbc_value, lobstr_value) VALUES
    ('Essence', 'essence', 'gasoline'),
    ('Diesel', 'diesel', 'diesel'),
    ('Électrique', 'electrique', 'electric'),
    ('Hybride', 'hybride', 'hybrid')
  ON CONFLICT (name) DO NOTHING;

  SELECT id INTO test_fuel_id FROM public.fuels WHERE name = 'Diesel' LIMIT 1;

  -- Gear Boxes
  INSERT INTO public.gear_boxes (name, lbc_value, lobstr_value) VALUES
    ('Manuelle', 'manuelle', 'manual'),
    ('Automatique', 'automatique', 'automatic')
  ON CONFLICT (name) DO NOTHING;

  SELECT id INTO test_gear_box_id FROM public.gear_boxes WHERE name = 'Automatique' LIMIT 1;

  -- Vehicle States
  INSERT INTO public.vehicle_states (name, lbc_value, lobstr_value) VALUES
    ('Occasion', 'occasion', 'used'),
    ('Neuf', 'neuf', 'new')
  ON CONFLICT (name) DO NOTHING;

  -- Vehicle Seats
  INSERT INTO public.vehicle_seats (name, lbc_value, lobstr_value) VALUES
    ('5 places', '5', '5'),
    ('7 places', '7', '7'),
    ('2 places', '2', '2')
  ON CONFLICT (name) DO NOTHING;

  -- Driving Licences
  INSERT INTO public.driving_licences (name, lbc_value, lobstr_value) VALUES
    ('Permis B', 'b', 'b'),
    ('Permis A', 'a', 'a')
  ON CONFLICT (name) DO NOTHING;

  -- Locations
  INSERT INTO public.locations (zipcode, name, lat, lng) VALUES
    ('75001', 'Paris', 48.8566, 2.3522),
    ('69001', 'Lyon', 45.7640, 4.8357),
    ('13001', 'Marseille', 43.2965, 5.3698),
    ('33000', 'Bordeaux', 44.8378, -0.5792)
  ON CONFLICT (zipcode, name) DO NOTHING;

  SELECT id INTO test_location_id FROM public.locations WHERE zipcode = '75001' LIMIT 1;

  -- ============================================================
  -- 3. CREDIT SYSTEM
  -- ============================================================

  -- Credit Packs
  INSERT INTO public.credit_packs (channel, credits, price_eur, is_active) VALUES
    ('sms', 100, 1000, true),
    ('sms', 500, 4500, true),
    ('whatsapp_text', 100, 800, true),
    ('ringless_voice', 100, 1500, true)
  ON CONFLICT DO NOTHING;

  -- Credit Balance for test account
  INSERT INTO public.credit_balances (account_id, sms, ringless_voice, whatsapp_text, updated_at)
  VALUES (
    test_account_id,
    1000,
    500,
    800,
    now()
  ) ON CONFLICT (account_id) DO UPDATE SET
    sms = EXCLUDED.sms,
    ringless_voice = EXCLUDED.ringless_voice,
    whatsapp_text = EXCLUDED.whatsapp_text;

  -- Credit Transactions (purchase history)
  INSERT INTO public.credit_transactions (account_id, type, channel, amount, balance_after, metadata, created_at)
  VALUES
    (test_account_id, 'purchase', 'sms', 1000, 1000, '{"pack_id": 1, "price_eur": 1000}'::jsonb, now() - interval '10 days'),
    (test_account_id, 'purchase', 'whatsapp_text', 800, 800, '{"pack_id": 3, "price_eur": 800}'::jsonb, now() - interval '10 days'),
    (test_account_id, 'purchase', 'ringless_voice', 500, 500, '{"pack_id": 4, "price_eur": 1500}'::jsonb, now() - interval '10 days')
  ON CONFLICT DO NOTHING;

  -- ============================================================
  -- 4. CHANNEL PRIORITIES & MESSAGE TEMPLATES
  -- ============================================================

  -- Channel Priorities
  INSERT INTO public.channel_priorities (channel, priority) VALUES
    ('whatsapp_text', 1),
    ('sms', 2),
    ('ringless_voice', 3)
  ON CONFLICT (channel) DO NOTHING;

  -- Template Variables
  INSERT INTO public.template_variables (key, label, description) VALUES
    ('titre_annonce', 'Titre de l''annonce', 'Le titre complet de l''annonce'),
    ('prix', 'Prix', 'Le prix du véhicule'),
    ('marque', 'Marque', 'La marque du véhicule'),
    ('modele', 'Modèle', 'Le modèle du véhicule'),
    ('nom_vendeur', 'Nom du vendeur', 'Le nom du propriétaire'),
    ('ville', 'Ville', 'La ville de l''annonce')
  ON CONFLICT (key) DO NOTHING;

  -- Message Templates
  INSERT INTO public.message_templates (id, account_id, name, channel, content, is_default, created_at, updated_at)
  VALUES (
    test_template_id,
    test_account_id,
    'Template SMS - Premier contact',
    'sms',
    'Bonjour, je suis intéressé par votre {titre_annonce} à {prix}€. Est-il toujours disponible ?',
    true,
    now(),
    now()
  ) ON CONFLICT (id) DO NOTHING;

  -- ============================================================
  -- 5. ADS (Test listings)
  -- ============================================================

  INSERT INTO public.ads (
    id, type_id, subtype_id, location_id, brand_id, fuel_id, gear_box_id,
    url, original_ad_id, title, description, price, owner_name,
    has_phone, phone_number, is_whatsapp_phone, model_year, mileage,
    initial_publication_date, last_publication_date, created_at
  ) VALUES
    (
      test_ad_id_1,
      test_ad_type_id,
      test_ad_subtype_id,
      test_location_id,
      test_brand_id,
      test_fuel_id,
      test_gear_box_id,
      'https://www.leboncoin.fr/ad/1234567',
      'lbc_1234567',
      'Renault Mégane 1.5 dCi - Occasion',
      'Belle Renault Mégane berline, diesel, très bon état, entretien suivi.',
      12500.00,
      'Pierre Martin',
      true,
      '+33612345678',
      true,
      2018,
      85000,
      current_date - 5,
      current_date - 2,
      current_date - 5
    ),
    (
      test_ad_id_2,
      test_ad_type_id,
      test_ad_subtype_id,
      test_location_id,
      test_brand_id,
      test_fuel_id,
      test_gear_box_id,
      'https://www.leboncoin.fr/ad/7654321',
      'lbc_7654321',
      'Renault Clio IV - Faible kilométrage',
      'Renault Clio en excellent état, première main, carnet d''entretien à jour.',
      9800.00,
      'Sophie Dubois',
      true,
      '+33687654321',
      false,
      2019,
      45000,
      current_date - 3,
      current_date - 1,
      current_date - 3
    )
  ON CONFLICT (id) DO NOTHING;

  -- ============================================================
  -- 6. HUNTS (Search campaigns)
  -- ============================================================

  INSERT INTO public.hunts (
    id, account_id, type_id, location_id, name, status, radius_in_km,
    price_min, price_max, mileage_max, model_year_min, auto_refresh,
    daily_pacing_limit, outreach_settings, template_ids, created_at, last_scan_at
  ) VALUES (
    test_hunt_id,
    test_account_id,
    test_ad_type_id,
    test_location_id,
    'Recherche Renault Île-de-France',
    'active',
    50,
    5000,
    15000,
    100000,
    2015,
    true,
    20,
    '{"sms": true, "whatsapp_text": true, "ringless_voice": false}'::jsonb,
    jsonb_build_object('sms', test_template_id::text),
    now() - interval '7 days',
    now() - interval '1 hour'
  ) ON CONFLICT (id) DO NOTHING;

  -- Hunt SubTypes filter
  INSERT INTO public.sub_types_hunts (hunt_id, sub_type_id)
  SELECT test_hunt_id, id FROM public.sub_types WHERE name IN ('Berline', 'SUV')
  ON CONFLICT DO NOTHING;

  -- Hunt Brands filter
  INSERT INTO public.brands_hunts (hunt_id, brand_id)
  SELECT test_hunt_id, id FROM public.brands WHERE name = 'Renault'
  ON CONFLICT DO NOTHING;

  -- Hunt Channel Credits
  INSERT INTO public.hunt_channel_credits (hunt_id, channel, credits_allocated, credits_consumed, created_at, updated_at)
  VALUES
    (test_hunt_id, 'sms', 200, 15, now() - interval '7 days', now()),
    (test_hunt_id, 'whatsapp_text', 150, 8, now() - interval '7 days', now())
  ON CONFLICT (hunt_id, channel) DO UPDATE SET
    credits_allocated = EXCLUDED.credits_allocated,
    credits_consumed = EXCLUDED.credits_consumed;

  -- ============================================================
  -- 7. LEADS (Generated from hunt)
  -- ============================================================

  INSERT INTO public.leads (
    id, account_id, hunt_id, ad_id, stage, assigned_to_id, position, notes, created_at, updated_at
  ) VALUES
    (
      test_lead_id_1,
      test_account_id,
      test_hunt_id,
      test_ad_id_1,
      'contacted',
      test_team_member_id,
      0,
      'Premier contact effectué',
      now() - interval '2 days',
      now() - interval '1 day'
    ),
    (
      test_lead_id_2,
      test_account_id,
      test_hunt_id,
      test_ad_id_2,
      'new',
      NULL,
      1,
      NULL,
      now() - interval '1 day',
      now() - interval '1 day'
    )
  ON CONFLICT (account_id, ad_id) DO NOTHING;

  -- Lead Activities
  INSERT INTO public.lead_activities (lead_id, type, metadata, created_at)
  VALUES
    (test_lead_id_1, 'created', '{"source": "hunt"}'::jsonb, now() - interval '2 days'),
    (test_lead_id_1, 'message_sent', '{"channel": "sms", "template": "Premier contact"}'::jsonb, now() - interval '2 days'),
    (test_lead_id_1, 'stage_change', '{"from": "new", "to": "contacted"}'::jsonb, now() - interval '1 day'),
    (test_lead_id_2, 'created', '{"source": "hunt"}'::jsonb, now() - interval '1 day')
  ON CONFLICT DO NOTHING;

  -- Lead Notes
  INSERT INTO public.lead_notes (lead_id, content, created_at)
  VALUES
    (test_lead_id_1, 'Vendeur intéressé, rappeler jeudi', now() - interval '1 day'),
    (test_lead_id_1, 'Prix négociable selon lui', now() - interval '6 hours')
  ON CONFLICT DO NOTHING;

  -- Lead Reminders
  INSERT INTO public.lead_reminders (lead_id, due_at, note, completed, created_at)
  VALUES
    (test_lead_id_1, now() + interval '2 days', 'Rappeler pour finaliser la vente', false, now()),
    (test_lead_id_2, now() + interval '1 day', 'Premier contact à faire', false, now())
  ON CONFLICT DO NOTHING;

  -- ============================================================
  -- 8. MESSAGES
  -- ============================================================

  INSERT INTO public.messages (
    lead_id, template_id, channel, content, status, sent_at, sent_by_id, created_at
  ) VALUES
    (
      test_lead_id_1,
      test_template_id,
      'whatsapp_text',
      'Bonjour, je suis intéressé par votre Renault Mégane 1.5 dCi - Occasion à 12500€. Est-il toujours disponible ?',
      'delivered',
      now() - interval '2 days',
      test_team_member_id,
      now() - interval '2 days'
    )
  ON CONFLICT DO NOTHING;

  -- ============================================================
  -- 9. CONTACTED ADS
  -- ============================================================

  INSERT INTO public.contacted_ads (ad_id, account_id, channel, created_at)
  VALUES
    (test_ad_id_1, test_account_id, 'whatsapp_text', current_date - 2)
  ON CONFLICT DO NOTHING;

  -- Record credit usage for the message sent
  INSERT INTO public.credit_transactions (account_id, type, channel, amount, balance_after, reference_id, metadata, created_at)
  SELECT
    test_account_id,
    'usage',
    'whatsapp_text',
    -1,
    799,
    m.id,
    jsonb_build_object('lead_id', m.lead_id, 'message_id', m.id),
    m.created_at
  FROM public.messages m
  WHERE m.lead_id = test_lead_id_1
  ON CONFLICT DO NOTHING;

END $$;

-- ============================================================
-- APP SETTINGS
-- ============================================================

INSERT INTO public.app_settings (sms_alerts, slack_alerts)
VALUES (true, true)
ON CONFLICT DO NOTHING;

-- Reset sequences if needed
SELECT setval(pg_get_serial_sequence('public.ad_types', 'id'), (SELECT MAX(id) FROM public.ad_types));
SELECT setval(pg_get_serial_sequence('public.sub_types', 'id'), (SELECT MAX(id) FROM public.sub_types));
SELECT setval(pg_get_serial_sequence('public.brands', 'id'), (SELECT MAX(id) FROM public.brands));
SELECT setval(pg_get_serial_sequence('public.fuels', 'id'), (SELECT MAX(id) FROM public.fuels));
SELECT setval(pg_get_serial_sequence('public.gear_boxes', 'id'), (SELECT MAX(id) FROM public.gear_boxes));
SELECT setval(pg_get_serial_sequence('public.vehicle_states', 'id'), (SELECT MAX(id) FROM public.vehicle_states));
SELECT setval(pg_get_serial_sequence('public.vehicle_seats', 'id'), (SELECT MAX(id) FROM public.vehicle_seats));
SELECT setval(pg_get_serial_sequence('public.driving_licences', 'id'), (SELECT MAX(id) FROM public.driving_licences));
SELECT setval(pg_get_serial_sequence('public.locations', 'id'), (SELECT MAX(id) FROM public.locations));
SELECT setval(pg_get_serial_sequence('public.credit_packs', 'id'), (SELECT MAX(id) FROM public.credit_packs));
SELECT setval(pg_get_serial_sequence('public.template_variables', 'id'), (SELECT MAX(id) FROM public.template_variables));
SELECT setval(pg_get_serial_sequence('public.channel_priorities', 'id'), (SELECT MAX(id) FROM public.channel_priorities));

-- Re-enable row security
SET row_security = on;

--
-- PostgreSQL database seed complete
--
