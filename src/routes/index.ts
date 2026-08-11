import { Router } from "express";

import { usersRoutes } from "./users-routes.js";
import { sessionsRoutes } from "./sessions-routes.js";
import { deliveriesRoutes } from "./deliveries-routes.js";
import { deliveryLogRoutes } from "./delivery-log-routes.js";

const routes = Router();

routes.use("/users", usersRoutes);
routes.use("/sessions", sessionsRoutes);
routes.use("/deliveries", deliveriesRoutes);
routes.use("/delivery-log", deliveryLogRoutes);

export { routes };
