CREATE TABLE "user_auth_factor_labels" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"factor_id" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_auth_factor_labels_factor_id_unique" UNIQUE("factor_id")
);
--> statement-breakpoint
ALTER TABLE "user_auth_factor_labels" ADD CONSTRAINT "user_auth_factor_labels_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_auth_factor_labels_userId_idx" ON "user_auth_factor_labels" USING btree ("user_id");