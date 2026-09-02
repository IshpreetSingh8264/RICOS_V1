/*
  Warnings:

  - You are about to drop the column `address1` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `address2` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `first_name` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `landmark` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `last_name` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `officials` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[aadhar_id]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `aadhar_id` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `current_address` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `emergency_contact_name` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `emergency_contact_phone` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `emergency_contact_relation` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `full_name` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phone_number` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `primary_language` to the `users` table without a default value. This is not possible if the table is not empty.
  - Made the column `city` on table `users` required. This step will fail if there are existing NULL values in that column.
  - Made the column `pincode` on table `users` required. This step will fail if there are existing NULL values in that column.
  - Made the column `state` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "address1",
DROP COLUMN "address2",
DROP COLUMN "first_name",
DROP COLUMN "landmark",
DROP COLUMN "last_name",
DROP COLUMN "location",
ADD COLUMN     "aadhar_id" TEXT NOT NULL,
ADD COLUMN     "allergies" TEXT,
ADD COLUMN     "alternate_phone" TEXT,
ADD COLUMN     "blood_group" TEXT,
ADD COLUMN     "communication_assistance" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "country" TEXT NOT NULL DEFAULT 'India',
ADD COLUMN     "current_address" TEXT NOT NULL,
ADD COLUMN     "disabilities" TEXT,
ADD COLUMN     "emergency_contact_name" TEXT NOT NULL,
ADD COLUMN     "emergency_contact_phone" TEXT NOT NULL,
ADD COLUMN     "emergency_contact_relation" TEXT NOT NULL,
ADD COLUMN     "full_name" TEXT NOT NULL,
ADD COLUMN     "home_location_lat" DOUBLE PRECISION,
ADD COLUMN     "home_location_lng" DOUBLE PRECISION,
ADD COLUMN     "live_location_permission" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "medical_conditions" TEXT,
ADD COLUMN     "phone_number" TEXT NOT NULL,
ADD COLUMN     "primary_language" TEXT NOT NULL,
ADD COLUMN     "secondary_language" TEXT,
ALTER COLUMN "city" SET NOT NULL,
ALTER COLUMN "pincode" SET NOT NULL,
ALTER COLUMN "state" SET NOT NULL;

-- DropTable
DROP TABLE "officials";

-- CreateTable
CREATE TABLE "ngos" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "ngo_name" TEXT NOT NULL,
    "registration_number" TEXT NOT NULL,
    "ngo_type" TEXT NOT NULL,
    "year_established" INTEGER NOT NULL,
    "mission_statement" TEXT,
    "official_contact" TEXT NOT NULL,
    "alternate_contact" TEXT,
    "website" TEXT,
    "registered_address" TEXT NOT NULL,
    "operational_areas" TEXT NOT NULL,
    "location_lat" DOUBLE PRECISION,
    "location_lng" DOUBLE PRECISION,
    "admin_name" TEXT NOT NULL,
    "admin_designation" TEXT NOT NULL,
    "admin_mobile" TEXT NOT NULL,
    "admin_email" TEXT NOT NULL,
    "aadhar_card" TEXT NOT NULL,
    "resource_types" TEXT,
    "team_strength" INTEGER,
    "bank_account_number" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ngos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "governments" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "agency_name" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "govt_level" TEXT NOT NULL,
    "official_id" TEXT NOT NULL,
    "department_code" TEXT NOT NULL,
    "hq_address" TEXT NOT NULL,
    "incharge_name" TEXT NOT NULL,
    "incharge_mobile" TEXT NOT NULL,
    "incharge_email" TEXT NOT NULL,
    "control_room_number" TEXT,
    "jurisdiction_area" TEXT NOT NULL,
    "resource_types" TEXT,
    "resource_capacity" INTEGER,
    "bank_account_number" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "governments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "volunteers" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "group_name" TEXT NOT NULL,
    "volunteer_type" TEXT NOT NULL,
    "group_size" INTEGER NOT NULL,
    "operational_areas" TEXT NOT NULL,
    "social_media_link" TEXT,
    "leader_name" TEXT NOT NULL,
    "leader_phone" TEXT NOT NULL,
    "leader_email" TEXT NOT NULL,
    "id_proof" TEXT,
    "has_medical_training" BOOLEAN NOT NULL DEFAULT false,
    "has_first_aid_cert" BOOLEAN NOT NULL DEFAULT false,
    "has_vehicle" BOOLEAN NOT NULL DEFAULT false,
    "languages_spoken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "volunteers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "responders" (
    "id" TEXT NOT NULL,
    "ngo_id" TEXT,
    "volunteer_id" TEXT,
    "govt_id" TEXT,
    "services_provided" TEXT NOT NULL,
    "bank_account_number" TEXT NOT NULL,
    "location_lat" DOUBLE PRECISION,
    "location_lng" DOUBLE PRECISION,
    "location_address" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "responders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ngos_email_key" ON "ngos"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ngos_registration_number_key" ON "ngos"("registration_number");

-- CreateIndex
CREATE UNIQUE INDEX "governments_email_key" ON "governments"("email");

-- CreateIndex
CREATE UNIQUE INDEX "governments_official_id_key" ON "governments"("official_id");

-- CreateIndex
CREATE UNIQUE INDEX "volunteers_email_key" ON "volunteers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "responders_ngo_id_key" ON "responders"("ngo_id");

-- CreateIndex
CREATE UNIQUE INDEX "responders_volunteer_id_key" ON "responders"("volunteer_id");

-- CreateIndex
CREATE UNIQUE INDEX "responders_govt_id_key" ON "responders"("govt_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_aadhar_id_key" ON "users"("aadhar_id");

-- AddForeignKey
ALTER TABLE "responders" ADD CONSTRAINT "responders_ngo_id_fkey" FOREIGN KEY ("ngo_id") REFERENCES "ngos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "responders" ADD CONSTRAINT "responders_volunteer_id_fkey" FOREIGN KEY ("volunteer_id") REFERENCES "volunteers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "responders" ADD CONSTRAINT "responders_govt_id_fkey" FOREIGN KEY ("govt_id") REFERENCES "governments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
