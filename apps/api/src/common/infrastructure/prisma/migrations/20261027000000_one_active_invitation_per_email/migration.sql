CREATE UNIQUE INDEX "invitations_email_unused_key"
ON "invitations" ("email")
WHERE "used_at" IS NULL;
