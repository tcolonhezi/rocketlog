import express from "express";

import { errorHandling } from "./middlewares/error-handling.js";
import { routes } from "./routes/index.js";
const app = express();

app.use(express.json());

app.use(errorHandling);

app.use(routes);

export { app };
