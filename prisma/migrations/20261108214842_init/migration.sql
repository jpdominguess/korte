-- CreateTable
CREATE TABLE "user" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "phone" TEXT,
    "role" TEXT NOT NULL DEFAULT 'CLIENT',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "account_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "id_token" TEXT,
    "access_token_expires_at" TIMESTAMPTZ(3),
    "refresh_token_expires_at" TIMESTAMPTZ(3),
    "scope" TEXT,
    "password" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "barbershop" (
    "id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "cep" TEXT,
    "street" TEXT,
    "number" TEXT,
    "city" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "logo_url" TEXT,

    CONSTRAINT "barbershop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "barber_profile" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "barber_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "duration_min" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "barber_service" (
    "barber_profile_id" UUID NOT NULL,
    "service_id" UUID NOT NULL,

    CONSTRAINT "barber_service_pkey" PRIMARY KEY ("barber_profile_id","service_id")
);

-- CreateTable
CREATE TABLE "work_schedule" (
    "id" UUID NOT NULL,
    "barber_profile_id" UUID NOT NULL,
    "weekday" INTEGER NOT NULL,
    "start_time" TIME(0) NOT NULL,
    "end_time" TIME(0) NOT NULL,

    CONSTRAINT "work_schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schedule_block" (
    "id" UUID NOT NULL,
    "barber_profile_id" UUID NOT NULL,
    "starts_at" TIMESTAMPTZ(3) NOT NULL,
    "ends_at" TIMESTAMPTZ(3) NOT NULL,
    "reason" TEXT,

    CONSTRAINT "schedule_block_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointment" (
    "id" UUID NOT NULL,
    "barber_profile_id" UUID NOT NULL,
    "service_id" UUID NOT NULL,
    "client_id" UUID,
    "walk_in_name" TEXT,
    "walk_in_phone" TEXT,
    "starts_at" TIMESTAMPTZ(3) NOT NULL,
    "ends_at" TIMESTAMPTZ(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AGENDADO',

    CONSTRAINT "appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment" (
    "id" UUID NOT NULL,
    "appointment_id" UUID,
    "subscription_id" UUID,
    "amount" DECIMAL(10,2) NOT NULL,
    "method" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "paid_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "uses_per_cycle" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_service" (
    "plan_id" UUID NOT NULL,
    "service_id" UUID NOT NULL,

    CONSTRAINT "plan_service_pkey" PRIMARY KEY ("plan_id","service_id")
);

-- CreateTable
CREATE TABLE "subscription" (
    "id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "cycle_start" DATE NOT NULL,
    "cycle_end" DATE NOT NULL,
    "total_uses" INTEGER NOT NULL,
    "used_uses" INTEGER NOT NULL DEFAULT 0,
    "canceled_at" TIMESTAMPTZ(3),

    CONSTRAINT "subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_usage" (
    "id" UUID NOT NULL,
    "subscription_id" UUID NOT NULL,
    "appointment_id" UUID NOT NULL,
    "used_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_usage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "session_user_id_idx" ON "session"("user_id");

-- CreateIndex
CREATE INDEX "account_user_id_idx" ON "account"("user_id");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "barbershop_owner_id_key" ON "barbershop"("owner_id");

-- CreateIndex
CREATE UNIQUE INDEX "barber_profile_user_id_key" ON "barber_profile"("user_id");

-- CreateIndex
CREATE INDEX "work_schedule_barber_profile_id_weekday_idx" ON "work_schedule"("barber_profile_id", "weekday");

-- CreateIndex
CREATE INDEX "schedule_block_barber_profile_id_starts_at_idx" ON "schedule_block"("barber_profile_id", "starts_at");

-- CreateIndex
CREATE INDEX "appointment_barber_profile_id_starts_at_idx" ON "appointment"("barber_profile_id", "starts_at");

-- CreateIndex
CREATE INDEX "appointment_client_id_idx" ON "appointment"("client_id");

-- CreateIndex
CREATE INDEX "appointment_starts_at_idx" ON "appointment"("starts_at");

-- CreateIndex
CREATE UNIQUE INDEX "payment_appointment_id_key" ON "payment"("appointment_id");

-- CreateIndex
CREATE INDEX "payment_paid_at_idx" ON "payment"("paid_at");

-- CreateIndex
CREATE INDEX "subscription_client_id_idx" ON "subscription"("client_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_usage_appointment_id_key" ON "subscription_usage"("appointment_id");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "barbershop" ADD CONSTRAINT "barbershop_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "barber_profile" ADD CONSTRAINT "barber_profile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "barber_service" ADD CONSTRAINT "barber_service_barber_profile_id_fkey" FOREIGN KEY ("barber_profile_id") REFERENCES "barber_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "barber_service" ADD CONSTRAINT "barber_service_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_schedule" ADD CONSTRAINT "work_schedule_barber_profile_id_fkey" FOREIGN KEY ("barber_profile_id") REFERENCES "barber_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schedule_block" ADD CONSTRAINT "schedule_block_barber_profile_id_fkey" FOREIGN KEY ("barber_profile_id") REFERENCES "barber_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_barber_profile_id_fkey" FOREIGN KEY ("barber_profile_id") REFERENCES "barber_profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_service" ADD CONSTRAINT "plan_service_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_service" ADD CONSTRAINT "plan_service_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_usage" ADD CONSTRAINT "subscription_usage_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_usage" ADD CONSTRAINT "subscription_usage_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Impede agendamentos ativos sobrepostos do mesmo barbeiro (RNF07)
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "appointment" ADD CONSTRAINT "appointment_no_overlap"
  EXCLUDE USING gist ("barber_profile_id" WITH =, tstzrange("starts_at", "ends_at") WITH &&)
  WHERE ("status" = 'AGENDADO');

ALTER TABLE "appointment" ADD CONSTRAINT "appointment_period_check" CHECK ("ends_at" > "starts_at");
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_status_check" CHECK ("status" IN ('AGENDADO', 'CONCLUIDO', 'CANCELADO', 'FALTOU'));
ALTER TABLE "user" ADD CONSTRAINT "user_role_check" CHECK ("role" IN ('OWNER', 'BARBER', 'CLIENT'));
ALTER TABLE "payment" ADD CONSTRAINT "payment_method_check" CHECK ("method" IN ('CASH', 'PIX', 'DEBIT', 'CREDIT'));
ALTER TABLE "payment" ADD CONSTRAINT "payment_origin_check" CHECK ("origin" IN ('APPOINTMENT', 'ACTIVATION', 'RENEWAL'));
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_uses_check" CHECK ("used_uses" >= 0 AND "used_uses" <= "total_uses");
