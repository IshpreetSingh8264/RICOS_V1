/*
  Warnings:

  - You are about to drop the column `password` on the `governments` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `ngos` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `volunteers` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "governments" DROP COLUMN "password";

-- AlterTable
ALTER TABLE "ngos" DROP COLUMN "password";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "password";

-- AlterTable
ALTER TABLE "volunteers" DROP COLUMN "password";

-- CreateTable
CREATE TABLE "all_users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "user_type" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "user_id" TEXT,
    "ngo_id" TEXT,
    "govt_id" TEXT,
    "volunteer_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "all_users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "all_users_email_key" ON "all_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "all_users_user_id_key" ON "all_users"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "all_users_ngo_id_key" ON "all_users"("ngo_id");

-- CreateIndex
CREATE UNIQUE INDEX "all_users_govt_id_key" ON "all_users"("govt_id");

-- CreateIndex
CREATE UNIQUE INDEX "all_users_volunteer_id_key" ON "all_users"("volunteer_id");

-- AddForeignKey
ALTER TABLE "all_users" ADD CONSTRAINT "all_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "all_users" ADD CONSTRAINT "all_users_ngo_id_fkey" FOREIGN KEY ("ngo_id") REFERENCES "ngos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "all_users" ADD CONSTRAINT "all_users_govt_id_fkey" FOREIGN KEY ("govt_id") REFERENCES "governments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "all_users" ADD CONSTRAINT "all_users_volunteer_id_fkey" FOREIGN KEY ("volunteer_id") REFERENCES "volunteers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
