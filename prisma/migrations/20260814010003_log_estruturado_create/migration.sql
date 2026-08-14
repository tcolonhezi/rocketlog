/*
  Warnings:

  - Added the required column `newStatus` to the `delivery_logs` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "delivery_logs" ADD COLUMN     "changedById" TEXT,
ADD COLUMN     "newStatus" "DeliveryStatus" NOT NULL,
ADD COLUMN     "previousStatus" "DeliveryStatus";

-- AddForeignKey
ALTER TABLE "delivery_logs" ADD CONSTRAINT "delivery_logs_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
