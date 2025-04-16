-- CreateTable
CREATE TABLE `Clients` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `email` VARCHAR(90) NULL,
    `name` VARCHAR(255) NOT NULL,
    `createdAt` TIMESTAMP NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AiConfiguration` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `clientId` INTEGER NULL,
    `apiKey` VARCHAR(255) NOT NULL,
    `basePrompt` VARCHAR(2000) NULL,
    `maxTokens` INTEGER NOT NULL DEFAULT 800,
    `model` VARCHAR(30) NOT NULL,
    `provider` VARCHAR(30) NOT NULL,
    `temperature` DOUBLE NOT NULL DEFAULT 0.5,
    `maxCharacters` INTEGER NULL DEFAULT 1500,
    `createdAt` TIMESTAMP NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ContentSource` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `clientId` INTEGER NULL,
    `category` VARCHAR(45) NULL,
    `url` VARCHAR(255) NOT NULL,
    `name` VARCHAR(45) NOT NULL,
    `createdAt` TIMESTAMP NULL,
    `authType` ENUM('none', 'basic', 'bearer', 'custom') NULL DEFAULT 'none',
    `authConfig` JSON NULL,
    `type` ENUM('rss', 'wordpress_api', 'custom_api') NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WordpressConfiguration` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `clientId` INTEGER NULL,
    `siteName` VARCHAR(255) NOT NULL,
    `siteUrl` VARCHAR(255) NOT NULL,
    `username` VARCHAR(50) NOT NULL,
    `appPassword` VARCHAR(100) NOT NULL,
    `createdAt` TIMESTAMP NULL,
    `defaultPostStatus` ENUM('publish', 'pending', 'draft', 'future', 'private', 'trash', 'auto-draft', 'inherit') NOT NULL DEFAULT 'publish',

    UNIQUE INDEX `WordpressConfiguration_siteUrl_key`(`siteUrl`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AiConfiguration` ADD CONSTRAINT `AiConfiguration_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Clients`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ContentSource` ADD CONSTRAINT `ContentSource_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Clients`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WordpressConfiguration` ADD CONSTRAINT `WordpressConfiguration_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Clients`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
