import { DeliveryStatus } from "@/generated/prisma/enums.js";

const transitions: Record<DeliveryStatus, DeliveryStatus[]> = {
  PENDING: ["IN_TRANSIT", "CANCELED"],
  IN_TRANSIT: ["DELIVERED", "CANCELED"],
  DELIVERED: [],
  CANCELED: [],
};

function isValidStatusTransition(
  from: DeliveryStatus,
  to: DeliveryStatus,
): boolean {
  return transitions[from].includes(to);
}

export { transitions, isValidStatusTransition };
