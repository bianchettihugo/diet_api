import fastify from "fastify";
import cookie from "@fastify/cookie";

import { mealsRoute } from "./routes/meals";

export const app = fastify();

app.register(cookie);

app.register(mealsRoute, {
  prefix: "meals",
});
