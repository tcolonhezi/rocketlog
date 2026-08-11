import { prisma } from "@/database/prisma.js";
import { DeliveryStatus } from "@/generated/prisma/enums.js";
import { AppError } from "@/util/AppError.js";
import { NextFunction, Request, Response } from "express";
import z from "zod";

class DeliveriesStatusController {
  async update(request: Request, response: Response, next: NextFunction) {
    const paramsSchema = z.object({
      delivery_id: z.uuid(),
    });
    const bodySchema = z.object({
      status: z.enum(DeliveryStatus),
    });

    try {
      const { delivery_id } = paramsSchema.parse(request.params);
      const { status } = bodySchema.parse(request.body);

      const delivery = await prisma.delivery.update({
        data: {
          status,
        },
        where: {
          id: delivery_id,
        },
      });
      return response.status(200).json(delivery);
    } catch (error) {
      return next(error);
    }
  }
}

export { DeliveriesStatusController };
