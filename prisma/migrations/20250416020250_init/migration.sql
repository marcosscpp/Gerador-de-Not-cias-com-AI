/*
  Warnings:

  - You are about to alter the column `createdAt` on the `AiConfiguration` table. The data in that column could be lost. The data in that column will be cast from `Timestamp(0)` to `Timestamp`.
  - You are about to alter the column `createdAt` on the `Clients` table. The data in that column could be lost. The data in that column will be cast from `Timestamp(0)` to `Timestamp`.
  - You are about to alter the column `createdAt` on the `ContentSource` table. The data in that column could be lost. The data in that column will be cast from `Timestamp(0)` to `Timestamp`.
  - You are about to alter the column `createdAt` on the `WordpressConfiguration` table. The data in that column could be lost. The data in that column will be cast from `Timestamp(0)` to `Timestamp`.

*/
-- AlterTable
ALTER TABLE `AiConfiguration` MODIFY `createdAt` TIMESTAMP NULL;

-- AlterTable
ALTER TABLE `Clients` MODIFY `createdAt` TIMESTAMP NULL;

-- AlterTable
ALTER TABLE `ContentSource` MODIFY `createdAt` TIMESTAMP NULL;

-- AlterTable
ALTER TABLE `WordpressConfiguration` MODIFY `createdAt` TIMESTAMP NULL;
