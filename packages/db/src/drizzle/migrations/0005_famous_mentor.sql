ALTER TABLE "ad_sub_types" DROP CONSTRAINT "ad_sub_type_name_unique";--> statement-breakpoint
ALTER TABLE "ad_sub_types" ADD CONSTRAINT "unique_subtype" UNIQUE("ad_type_id","name");