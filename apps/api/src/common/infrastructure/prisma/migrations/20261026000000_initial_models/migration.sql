-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "account_status" AS ENUM ('active', 'deleting', 'deleted');

-- CreateEnum
CREATE TYPE "access_request_whatsapp_provider" AS ENUM ('evolution_api', 'other', 'none_yet');

-- CreateEnum
CREATE TYPE "access_request_status" AS ENUM ('pending', 'invited', 'rejected');

-- CreateEnum
CREATE TYPE "consent_method" AS ENUM ('whatsapp', 'in_person', 'form', 'other');

-- CreateEnum
CREATE TYPE "contact_privacy_event_type" AS ENUM ('blocked', 'unblocked');

-- CreateEnum
CREATE TYPE "contact_privacy_event_channel" AS ENUM ('whatsapp', 'panel');

-- CreateTable
CREATE TABLE "account_users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" BYTEA NOT NULL,
    "password_changed_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "disabled_at" TIMESTAMPTZ(3),

    CONSTRAINT "account_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    "send_window_start" TIME(0) NOT NULL DEFAULT '08:00:00'::time,
    "send_window_end" TIME(0) NOT NULL DEFAULT '20:00:00'::time,
    "first_send_lead_minutes" INTEGER NOT NULL DEFAULT 1440,
    "response_cutoff_minutes" INTEGER NOT NULL DEFAULT 120,
    "reminder_delay_minutes" INTEGER NOT NULL DEFAULT 240,
    "status" "account_status" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "account_user_id" UUID NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invitations" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "token_hash" BYTEA NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "used_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_requests" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "company_or_project" TEXT NOT NULL,
    "whatsapp_provider" "access_request_whatsapp_provider" NOT NULL,
    "intended_use" TEXT,
    "status" "access_request_status" NOT NULL DEFAULT 'pending',
    "consent_at" TIMESTAMPTZ(3) NOT NULL,
    "received_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "access_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "prefix" TEXT NOT NULL,
    "secret_hash" BYTEA NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMPTZ(3),

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_templates" (
    "account_id" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "message_templates_pkey" PRIMARY KEY ("account_id")
);

-- CreateTable
CREATE TABLE "monthly_usage" (
    "account_id" UUID NOT NULL,
    "period_start" DATE NOT NULL,
    "timezone" TEXT NOT NULL,
    "accepted_appointments" INTEGER NOT NULL DEFAULT 0,
    "notified_80_at" TIMESTAMPTZ(3),
    "notified_100_at" TIMESTAMPTZ(3),

    CONSTRAINT "monthly_usage_pkey" PRIMARY KEY ("account_id","period_start")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" UUID NOT NULL,
    "account_user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "used_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_blocks" (
    "account_id" UUID NOT NULL,
    "phone_hash" BYTEA NOT NULL,
    "is_blocked" BOOLEAN NOT NULL DEFAULT false,
    "blocked_at" TIMESTAMPTZ(3),
    "current_sequence" INTEGER NOT NULL DEFAULT 0,
    "effective_sequence" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "contact_blocks_pkey" PRIMARY KEY ("account_id","phone_hash")
);

-- CreateTable
CREATE TABLE "unblock_requests" (
    "operation_id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "phone_hash" BYTEA NOT NULL,
    "sequence" INTEGER NOT NULL,
    "consent_method" "consent_method" NOT NULL,
    "consent_at" TIMESTAMPTZ(3) NOT NULL,
    "requested_at" TIMESTAMPTZ(3) NOT NULL,
    "recorded_by_user_id" UUID NOT NULL,

    CONSTRAINT "unblock_requests_pkey" PRIMARY KEY ("operation_id")
);

-- CreateTable
CREATE TABLE "contact_privacy_events" (
    "id" UUID NOT NULL,
    "account_id" UUID NOT NULL,
    "phone_hash" BYTEA NOT NULL,
    "sequence" INTEGER NOT NULL,
    "type" "contact_privacy_event_type" NOT NULL,
    "occurred_at" TIMESTAMPTZ(3) NOT NULL,
    "channel" "contact_privacy_event_channel" NOT NULL,
    "consent_method" "consent_method",
    "consent_at" TIMESTAMPTZ(3),
    "recorded_by_user_id" UUID,

    CONSTRAINT "contact_privacy_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "account_users_email_key" ON "account_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_account_user_id_key" ON "accounts"("account_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "invitations_token_hash_key" ON "invitations"("token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "access_requests_email_key" ON "access_requests"("email");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_hash_key" ON "password_reset_tokens"("token_hash");

-- CreateIndex
CREATE UNIQUE INDEX "unblock_requests_account_id_phone_hash_key" ON "unblock_requests"("account_id", "phone_hash");

-- CreateIndex
CREATE UNIQUE INDEX "contact_privacy_events_account_id_phone_hash_sequence_key" ON "contact_privacy_events"("account_id", "phone_hash", "sequence");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_account_user_id_fkey" FOREIGN KEY ("account_user_id") REFERENCES "account_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_templates" ADD CONSTRAINT "message_templates_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_usage" ADD CONSTRAINT "monthly_usage_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_account_user_id_fkey" FOREIGN KEY ("account_user_id") REFERENCES "account_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_blocks" ADD CONSTRAINT "contact_blocks_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unblock_requests" ADD CONSTRAINT "unblock_requests_account_id_phone_hash_fkey" FOREIGN KEY ("account_id", "phone_hash") REFERENCES "contact_blocks"("account_id", "phone_hash") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unblock_requests" ADD CONSTRAINT "unblock_requests_recorded_by_user_id_fkey" FOREIGN KEY ("recorded_by_user_id") REFERENCES "account_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_privacy_events" ADD CONSTRAINT "contact_privacy_events_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_privacy_events" ADD CONSTRAINT "contact_privacy_events_account_id_phone_hash_fkey" FOREIGN KEY ("account_id", "phone_hash") REFERENCES "contact_blocks"("account_id", "phone_hash") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_privacy_events" ADD CONSTRAINT "contact_privacy_events_recorded_by_user_id_fkey" FOREIGN KEY ("recorded_by_user_id") REFERENCES "account_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
