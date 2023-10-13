import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { randomUUID } from "crypto";
import { z } from "zod";
import { checkSessionIdExists } from "../middlewares/check-session-id-exists";
import { knex } from "../database";

export async function mealsRoute(app: FastifyInstance) {
  app.get("/", async (request: FastifyRequest) => {
    const meals = await knex("meals")
      .where({
        session_id: request.headers["session-id"] as string,
      })
      .select();

    return {
      meals,
    };
  });

  app.get("/:id", async (request: FastifyRequest) => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    });

    const { id } = paramsSchema.parse(request.params);

    const meal = await knex("meals")
      .where({ session_id: request.headers["session-id"] as string, id })
      .first();

    return {
      meal,
    };
  });

  app.get("/metrics", async (request: FastifyRequest) => {
    const meals = await knex("meals")
      .select()
      .where({
        session_id: request.headers["session-id"] as string,
      })
      .orderBy("time", "desc");

    const onDietMeals = meals.reduce(
      (total, meal) => (meal.include ? ++total : total),
      0,
    );

    const offDietMeals = meals.reduce(
      (total, meal) => (!meal.include ? ++total : total),
      0,
    );

    let bestSequence = 0;
    let bestSequenceSoFar = 0;

    meals.forEach((meal) => {
      meal.on_diet ? bestSequenceSoFar++ : (bestSequenceSoFar = 0);

      if (bestSequenceSoFar > bestSequence) {
        bestSequence = bestSequenceSoFar;
      }
    });

    return {
      metrics: {
        recorded_meals: meals.length,
        on_diet_meals: onDietMeals,
        off_diet_meals: offDietMeals,
        best_sequence: bestSequence,
      },
    };
  });

  app.post(
    "/",
    {
      preHandler: [checkSessionIdExists],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const bodySchema = z.object({
        name: z.string().min(3).max(255),
        description: z.string().max(255),
        time: z.string(),
        include: z.boolean().default(true),
      });

      const body = bodySchema.parse(request.body);

      await knex("meals").insert({
        id: randomUUID(),
        name: body.name,
        description: body.description,
        time: body.time,
        include: body.include,
        session_id: request.headers["session-id"] as string,
      });

      return reply.status(201).send();
    },
  );

  app.put(
    "/:id",
    {
      preHandler: [checkSessionIdExists],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const paramsSchema = z.object({
        id: z.string().uuid(),
      });

      const { id } = paramsSchema.parse(request.params);

      const bodySchema = z.object({
        name: z.optional(z.string().min(3).max(255)),
        description: z.optional(z.string().max(255)),
        time: z.optional(z.string()),
        include: z.optional(z.boolean().default(true)),
      });

      const body = bodySchema.parse(request.body);

      await knex("meals")
        .where({ session_id: request.headers["session-id"] as string, id })
        .update({
          name: body.name,
          description: body.description,
          time: body.time,
          include: body.include,
        });

      return reply.status(204).send();
    },
  );

  app.delete("/:id", async (request: FastifyRequest, reply: FastifyReply) => {
    const paramsSchema = z.object({
      id: z.string().uuid(),
    });

    const { id } = paramsSchema.parse(request.params);

    await knex("meals")
      .where({ session_id: request.headers["session-id"] as string, id })
      .del();

    return reply.status(204).send();
  });
}
