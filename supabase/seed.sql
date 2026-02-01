BEGIN;


INSERT INTO public.app_settings (id, sms_alerts, slack_alerts)
VALUES (1, false, true)
ON CONFLICT (id) DO NOTHING;


INSERT INTO public.ad_types (id, name, lbc_value, lobstr_value) VALUES
(1, 'Voiture', 'voitures', 'car'),
(2, 'Moto', 'motos', 'motorcycle'),
(3, 'Utilitaire', 'utilitaires', 'van')
ON CONFLICT (id) DO NOTHING;


INSERT INTO public.brands (id, name, lbc_value, lobstr_value) VALUES
(1, 'Renault', 'renault', 'renault'),
(2, 'Peugeot', 'peugeot', 'peugeot'),
(3, 'Citroën', 'citroen', 'citroen'),
(4, 'Volkswagen', 'volkswagen', 'volkswagen'),
(5, 'BMW', 'bmw', 'bmw')
ON CONFLICT (id) DO NOTHING;


INSERT INTO public.fuels (id, name, lbc_value, lobstr_value) VALUES
(1, 'Essence', 'essence', 'petrol'),
(2, 'Diesel', 'diesel', 'diesel'),
(3, 'Hybride', 'hybride', 'hybrid'),
(4, 'Électrique', 'electrique', 'electric'),
(5, 'GPL', 'gpl', 'lpg')
ON CONFLICT (id) DO NOTHING;


INSERT INTO public.gear_boxes (id, name, lbc_value, lobstr_value) VALUES
(1, 'Manuelle', 'manuelle', 'manual'),
(2, 'Automatique', 'automatique', 'automatic')
ON CONFLICT (id) DO NOTHING;


INSERT INTO public.driving_licences (id, name, lbc_value, lobstr_value) VALUES
(1, 'B', 'b', 'b'),
(2, 'A', 'a', 'a'),
(3, 'A2', 'a2', 'a2')
ON CONFLICT (id) DO NOTHING;

COMMIT;