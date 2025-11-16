/*
  Warnings:

  - You are about to drop the column `circleUserId` on the `User` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "User_circleUserId_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "circleUserId";
