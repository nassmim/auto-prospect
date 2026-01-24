CREATE TABLE "channel_priorities" (
	"id" "smallserial" PRIMARY KEY NOT NULL,
	"channel" "message_type" NOT NULL,
	"priority" "smallserial" NOT NULL,
	CONSTRAINT "channel_priorities_channel_unique" UNIQUE("channel"),
	CONSTRAINT "channel_priorities_priority_unique" UNIQUE("priority")
);
--> statement-breakpoint
ALTER TABLE "channel_priorities" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "enable read for authenticated users" ON "channel_priorities" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);