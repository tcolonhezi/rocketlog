import { prisma } from "@/database/prisma.js";
import { Request, Response, NextFunction } from "express";
import z, { includes } from "zod";

class DeliveriesController {
  async create(request: Request, response: Response, next: NextFunction) {
    const bodySchema = z.object({
      user_id: z.uuid(),
      description: z.string(),
      address: z.string(),
    });

    const { user_id, description, address } = bodySchema.parse(request.body);

    const delivery = await prisma.delivery.create({
      data: {
        userId: user_id,
        description,
        address,
      },
    });

    return response.status(201).json(delivery);
  }

  async index(request: Request, response: Response) {
    const deliveries = await prisma.delivery.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return response.json(deliveries);
  }

  async show(request: Request, response: Response, next: NextFunction) {
    const paramsSchema = z.object({
      delivery_id: z.uuid(),
    });

    const { delivery_id } = paramsSchema.parse(request.params);

    const deliveryWithLogs = await prisma.delivery.findUnique({
      where: { id: delivery_id },
      include: {
        deliveryLogs: true,
      },
    });

    return response.json(deliveryWithLogs);
  }
}

export { DeliveriesController };
