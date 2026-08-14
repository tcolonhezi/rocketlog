import { prisma } from "@/database/prisma.js";
import { DeliveryStatus } from "@/generated/prisma/enums.js";
import { AppError } from "@/util/AppError.js";
import { isValidStatusTransition } from "@/util/delivery-transitions.js";
import { NextFunction, Request, Response } from "express";
import z from "zod";

class DeliveryLogController {
  async create(request: Request, response: Response, next: NextFunction) {
    const bodySchema = z.object({
      delivery_id: z.uuid(),
      status: z.enum(DeliveryStatus),
      description: z.string(),
    });

    const transitions: Record<DeliveryStatus, DeliveryStatus[]> = {
      PENDING: ["IN_TRANSIT", "CANCELED"],
      IN_TRANSIT: ["DELIVERED", "CANCELED"],
      DELIVERED: [],
      CANCELED: [],
    };

    try {
      const { delivery_id, description, status } = bodySchema.parse(
        request.body,
      );

      const delivery = await prisma.delivery.findUnique({
        where: { id: delivery_id },
      });

      if (!delivery) {
        throw new AppError("Delivery not found.");
      }
      const changedBy = request.user.id;
      const previousStatus = delivery.status;

      if (transitions[previousStatus].length === 0) {
        throw new AppError(
          "Delivery is already in a final state and cannot be changed.",
        );
      }

      if (!isValidStatusTransition(previousStatus, status)) {
        throw new AppError("This transition is not valid.");
      }

      const [, deliveryLog] = await prisma.$transaction([
        prisma.delivery.update({
          data: {
            status,
          },
          where: {
            id: delivery_id,
          },
        }),
        prisma.deliveryLog.create({
          data: {
            description,
            deliveryId: delivery_id,
            changedById: changedBy,
            newStatus: status,
            previousStatus: previousStatus,
          },
        }),
      ]);

      return response.status(200).json(deliveryLog);
    } catch (error) {
      return next(error);
    }
  }
}

export { DeliveryLogController };
