import { UserRole } from "@/generated/prisma/enums.ts";
declare global {
  declare namespace Express {
    export interface Request {
      user: {
        id: string;
        role: UserRole;
      };
    }
  }
}
