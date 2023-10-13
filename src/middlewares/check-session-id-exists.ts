import { FastifyReply, FastifyRequest } from "fastify";

export async function checkSessionIdExists(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const sessionId = request.headers["session-id"] as string;

  if (!sessionId) {
    return reply.status(401).send({
      error: "Unauthorized.",
    });
  }
}
