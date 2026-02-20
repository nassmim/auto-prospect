ALTER TABLE "sub_types" RENAME TO "ad_sub_types";--> statement-breakpoint
ALTER TABLE "ad_sub_types" DROP CONSTRAINT "sub_types_ad_type_id_ad_types_id_fk";
--> statement-breakpoint
ALTER TABLE "ads" DROP CONSTRAINT "ads_subtype_id_sub_types_id_fk";
--> statement-breakpoint
ALTER TABLE "sub_types_hunts" DROP CONSTRAINT "sub_types_id_fk";
--> statement-breakpoint
ALTER TABLE "ad_sub_types" ADD CONSTRAINT "ad_sub_types_ad_type_id_ad_types_id_fk" FOREIGN KEY ("ad_type_id") REFERENCES "public"."ad_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ads" ADD CONSTRAINT "ads_subtype_id_ad_sub_types_id_fk" FOREIGN KEY ("subtype_id") REFERENCES "public"."ad_sub_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sub_types_hunts" ADD CONSTRAINT "sub_types_id_fk" FOREIGN KEY ("sub_type_id") REFERENCES "public"."ad_sub_types"("id") ON DELETE no action ON UPDATE no action;