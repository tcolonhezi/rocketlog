import { Request, Response } from "express";

class UserController {
  create(request: Request, response: Response) {
    return response.status(201).json({ message: "User created successfully" });
  }

  show(request: Request, response: Response) {
    return response
      .status(200)
      .json({ message: "User retrieved successfully" });
  }
}

export { UserController };
