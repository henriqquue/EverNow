-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "LGPDAuditAction" ADD VALUE 'ADMIN_LOGIN';
ALTER TYPE "LGPDAuditAction" ADD VALUE 'ADMIN_LOGOUT';
ALTER TYPE "LGPDAuditAction" ADD VALUE 'REPORT_RESOLVED';
ALTER TYPE "LGPDAuditAction" ADD VALUE 'BANNER_CREATED';
ALTER TYPE "LGPDAuditAction" ADD VALUE 'BANNER_UPDATED';
ALTER TYPE "LGPDAuditAction" ADD VALUE 'BANNER_DELETED';
ALTER TYPE "LGPDAuditAction" ADD VALUE 'SUBSCRIPTION_MODIFIED';
ALTER TYPE "LGPDAuditAction" ADD VALUE 'USER_BLOCKED';
ALTER TYPE "LGPDAuditAction" ADD VALUE 'USER_UNBLOCKED';
ALTER TYPE "LGPDAuditAction" ADD VALUE 'SETTINGS_CHANGED';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "birthChartData" JSONB,
ADD COLUMN     "birthPlace" TEXT,
ADD COLUMN     "birthTime" TEXT,
ADD COLUMN     "signo" TEXT;
