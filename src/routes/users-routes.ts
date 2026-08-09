import { Router } from "express";
import { UserController } from "../controllers/users-controller.js";
import { ensureAuthenticated } from "@/middlewares/ensureAuthenticated.js";

const usersRoutes = Router();
const userController = new UserController();

usersRoutes.post("/", userController.create);
usersRoutes.get("/", ensureAuthenticated, userController.show);

export { usersRoutes };
