import { prisma } from "@/database/prisma.js";
import { AppError } from "@/util/AppError.js";
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

    try {
      const { delivery_id } = paramsSchema.parse(request.params);

      const deliveryWithLogs = await prisma.delivery.findUnique({
        where: { id: delivery_id },
        include: {
          deliveryLogs: true,
        },
      });

      if (!deliveryWithLogs) {
        throw new AppError("Delivery not found.");
      }
      if (
        request.user.role === "CUSTOMER" &&
        request.user.id !== deliveryWithLogs.userId
      ) {
        throw new AppError("The user can only view their deliveries.");
      }

      return response.json(deliveryWithLogs);
    } catch (error) {
      return next(error);
    }
  }
}

export { DeliveriesController };
