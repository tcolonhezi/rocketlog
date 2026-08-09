import { env } from "@/env.js";
import { UserRole } from "@/generated/prisma/enums.js";
import { AppError } from "@/util/AppError.js";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import z from "zod";

interface CustomJwtPayload {
  role: UserRole;
  sub: string;
}

function ensureAuthenticated(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  try {
    const authorizationSchema = z.string();
    const authHeader = authorizationSchema.parse(request.headers.authorization);

    if (!authHeader) {
      throw new AppError("Token not founded.", 401);
    }

    const [, token] = authHeader.split(" ");

    const { role, sub } = jwt.verify(token, env.JWT_SECRET) as CustomJwtPayload;

    request.user = {
      id: sub,
      role: role as UserRole,
    };

    return next();
  } catch (error) {
    return next(new AppError("Invalid JWT token", 401));
  }
}

export { ensureAuthenticated };
