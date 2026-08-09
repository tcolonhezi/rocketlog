import { AppError } from "@/util/AppError.js";
import { Request, Response, NextFunction } from "express";

export function verifyUserAuthorization(requiredPermissions: string[]) {
  return (request: Request, response: Response, next: NextFunction) => {
    if (!request.user) {
      throw new AppError("User not authenticated.", 401);
    }

    const hasPermission = requiredPermissions.some((permission) =>
      request.user.role.includes(permission),
    );

    if (!hasPermission) {
      throw new AppError("User does not have the required role.", 403);
    }

    return next();
  };
}
