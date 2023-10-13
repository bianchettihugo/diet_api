import { FastifyInstance } from "fastify";

export async function mealsRoute(app: FastifyInstance) {
  app.get("/", async () => "Hello World!");
}
