CREATE TYPE "whatsapp_connection_status" AS ENUM ('active', 'replacing', 'inactive');
CREATE TYPE "whatsapp_connection_state" AS ENUM ('connected', 'disconnected');

CREATE TABLE "whatsapp_connections" (
    "id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "instance_identifier" TEXT NOT NULL,
    "sender_phone" TEXT NOT NULL,
    "send_credentials_cipher" BYTEA NOT NULL,
    "receive_secret_cipher" BYTEA NOT NULL,
    "status" "whatsapp_connection_status" NOT NULL DEFAULT 'active',
    "connection_status" "whatsapp_connection_state" NOT NULL,
    "provider_version" TEXT,
    "last_checked_at" TIMESTAMPTZ(3),
    "connected_at" TIMESTAMPTZ(3),
    "replaced_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "whatsapp_connections_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "whatsapp_connections_account_id_status_idx"
ON "whatsapp_connections"("account_id", "status");

CREATE UNIQUE INDEX "whatsapp_connections_one_active_per_account"
ON "whatsapp_connections"("account_id") WHERE "status" = 'active';

ALTER TABLE "whatsapp_connections"
ADD CONSTRAINT "whatsapp_connections_account_id_fkey"
FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
