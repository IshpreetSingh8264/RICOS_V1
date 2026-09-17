/*
  Warnings:

  - You are about to drop the column `emergency_contact_name` on the `ngos` table. All the data in the column will be lost.
  - You are about to drop the column `emergency_contact_phone` on the `ngos` table. All the data in the column will be lost.
  - You are about to drop the column `emergency_contact_relation` on the `ngos` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ngos" DROP COLUMN "emergency_contact_name",
DROP COLUMN "emergency_contact_phone",
DROP COLUMN "emergency_contact_relation";
