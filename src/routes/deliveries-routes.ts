import { Router } from "express";
import { ensureAuthenticated } from "@/middlewares/ensureAuthenticated.js";
import { DeliveriesController } from "@/controllers/deliveries-controller.js";
import { verifyUserAuthorization } from "@/middlewares/verifyUserAuthorization.js";

const deliveriesRoutes = Router();
const deliveriesController = new DeliveriesController();

deliveriesRoutes.use(ensureAuthenticated);
deliveriesRoutes.post(
  "/",
  verifyUserAuthorization(["ADMIN"]),
  deliveriesController.create,
);
deliveriesRoutes.get(
  "/",
  verifyUserAuthorization(["ADMIN", "DRIVER"]),
  deliveriesController.index,
);

deliveriesRoutes.get(
  "/:delivery_id",
  verifyUserAuthorization(["ADMIN", "DRIVER", "CUSTOMER"]),
  deliveriesController.show,
);

export { deliveriesRoutes };
