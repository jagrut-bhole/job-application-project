/*
  Warnings:

  - You are about to drop the column `role` on the `Application` table. All the data in the column will be lost.
  - Added the required column `position` to the `Application` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Application" DROP COLUMN "role",
ADD COLUMN     "position" TEXT NOT NULL;
