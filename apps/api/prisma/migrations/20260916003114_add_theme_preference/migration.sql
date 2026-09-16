-- CreateEnum
CREATE TYPE "ThemePreference" AS ENUM ('SYSTEM', 'LIGHT', 'DARK');

-- AlterTable
ALTER TABLE "child_profiles" ADD COLUMN     "themePreference" "ThemePreference" NOT NULL DEFAULT 'SYSTEM';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "themePreference" "ThemePreference" NOT NULL DEFAULT 'SYSTEM';
