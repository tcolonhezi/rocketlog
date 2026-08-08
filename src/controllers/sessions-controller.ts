import { authConfig } from "@/configs/auth.js";
import { prisma } from "@/database/prisma.js";
import { AppError } from "@/util/AppError.js";
import { compare } from "bcrypt";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import z from "zod";

class SessionsController {
  async create(request: Request, response: Response, next: NextFunction) {
    const bodySchema = z.object({
      email: z.email(),
      password: z.string().min(6),
    });

    const { email, password } = bodySchema.parse(request.body);

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new AppError("Invalid email or password.", 401);
    }

    const isPasswordCorrect = await compare(password, user.password);

    if (!isPasswordCorrect) {
      throw new AppError("Invalid email or password.", 401);
    }

    const { secret, expiresIn } = authConfig.jwt;

    const token = jwt.sign({ role: user.role ?? "CUSTOMER" }, secret, {
      expiresIn,
      subject: String(user.id),
    });

    const { password: hashedPassword, ...userWithoutPassword } = user;

    return response.status(200).json({ token, user: userWithoutPassword });
  }
}

export { SessionsController };
