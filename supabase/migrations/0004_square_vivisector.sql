ALTER TABLE "ads" ADD COLUMN "is_whatsapp_phone" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "ads" DROP COLUMN "cylynder";--> statement-breakpoint
ALTER POLICY "enable read for all users" ON "sub_types" TO authenticated USING (true);--> statement-breakpoint
ALTER POLICY "enable read for all users" ON "ad_types" TO authenticated USING (true);--> statement-breakpoint
ALTER POLICY "enable read for all users" ON "brands" TO authenticated USING (true);--> statement-breakpoint
ALTER POLICY "enable read for all users" ON "driving_licences" TO authenticated USING (true);--> statement-breakpoint
ALTER POLICY "enable read for all users" ON "fuels" TO authenticated USING (true);--> statement-breakpoint
ALTER POLICY "enable read for all users" ON "gear_boxes" TO authenticated USING (true);--> statement-breakpoint
ALTER POLICY "enable read for all users" ON "vehicle_seats" TO authenticated USING (true);--> statement-breakpoint
ALTER POLICY "enable read for all users" ON "vehicle_states" TO authenticated USING (true);--> statement-breakpoint
ALTER POLICY "enable read for all users" ON "zipcodes" TO authenticated USING (true);