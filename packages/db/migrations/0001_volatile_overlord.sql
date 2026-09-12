ALTER TABLE "ideas" ADD COLUMN "invite_token" text;--> statement-breakpoint
ALTER TABLE "ideas" ADD CONSTRAINT "ideas_invite_token_unique" UNIQUE("invite_token");