import { NextFunction, Request, Response } from "express";
import z from "zod";
import { Prisma, User } from "../generated/prisma/client.js";
import { hash } from "bcrypt";
import { prisma } from "@/database/prisma.js";
import { AppError } from "@/util/AppError.js";

class UserController {
  async create(request: Request, response: Response, next: NextFunction) {
    try {
      const bodySchema = z.object({
        name: z.string().min(3).max(50),
        email: z.email(),
        password: z.string().min(6),
      });

      const { name, email, password } = bodySchema.parse(request.body);

      const hashedPassword = await hash(password, 8);

      const insertedUser = await prisma.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
        },
      });

      const { password: _, ...userWithoutPassword } = insertedUser;
      return response.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return next(error);
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          return next(new AppError("Email already exists", 409));
        }
        return next(new AppError("Database error", 500));
      }
      return next(new AppError("Internal server error", 500));
    }
  }

  show(request: Request, response: Response) {
    return response
      .status(200)
      .json({ message: "User retrieved successfully" });
  }
}

export { UserController };
