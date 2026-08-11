import { Router } from "express";
import { ensureAuthenticated } from "@/middlewares/ensureAuthenticated.js";
import { verifyUserAuthorization } from "@/middlewares/verifyUserAuthorization.js";
import { DeliveryLogController } from "@/controllers/delivery-logs-controller.js";

const deliveryLogRoutes = Router();
const deliveryLogController = new DeliveryLogController();

deliveryLogRoutes.use(ensureAuthenticated);
deliveryLogRoutes.post(
  "/",
  verifyUserAuthorization(["ADMIN", "DRIVER"]),
  deliveryLogController.create,
);

export { deliveryLogRoutes };
