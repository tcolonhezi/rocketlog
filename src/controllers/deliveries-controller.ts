import { Request, Response, NextFunction } from "express";

class DeliveriesController {
  create(request: Request, response: Response, next: NextFunction) {
    return response.status(200).json({ message: "OK" });
  }
}

export { DeliveriesController };
