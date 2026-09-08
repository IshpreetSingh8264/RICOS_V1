/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `groups` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "groups" ADD COLUMN     "email" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "groups_email_key" ON "groups"("email");
