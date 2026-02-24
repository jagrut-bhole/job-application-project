/*
  Warnings:

  - A unique constraint covering the columns `[adminId]` on the table `Company` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Company_adminId_key" ON "Company"("adminId");
