import { prisma } from "@/database/prisma.js";
import { DeliveryStatus } from "@/generated/prisma/enums.js";
import { AppError } from "@/util/AppError.js";
import { NextFunction, Request, Response } from "express";
import z from "zod";

class DeliveryLogController {
  async create(request: Request, response: Response, next: NextFunction) {
    const bodySchema = z.object({
      delivery_id: z.uuid(),
      status: z.enum(DeliveryStatus),
      description: z.string(),
    });

    try {
      const { delivery_id, description, status } = bodySchema.parse(
        request.body,
      );

      // if (!Object.values(DeliveryStatus).includes(status as DeliveryStatus)) {
      //   throw new AppError("Status out of standard.");
      // }

      const delivery = await prisma.delivery.findUnique({
        where: { id: delivery_id },
      });

      if (!delivery) {
        throw new AppError("Delivery not found.");
      }

      if (delivery.status == "CANCELED" || delivery.status == "DELIVERED") {
        throw new AppError(
          "Delivery is canceled or already delivered, cannot be changed.",
        );
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
