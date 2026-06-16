import { Router } from "express";
import redisClient, { PROMPT_CACHE_TTL_SECONDS } from "../services/redis.js";
import pool from "../services/postgres.js";
import { validatePayload } from "../middleware/validate.js";
import { checkExactCache } from "../middleware/cache.js";
import { checkSemanticCache } from "../middleware/semanticCache.js";
import { logTelemetry } from "../services/telemetry.js";
import { determineRouteChain } from "../services/router.js";
import { streamWithFallback } from "../services/llm.js";

const router = Router();

router.post(
  "/",
  validatePayload,
  checkExactCache, // L1: Redis
  checkSemanticCache, // L2: Postgres + Python
  async (req, res) => {
    const { prompt, cacheKey, embedding, vector, similarity } = req.body;

    try {
      const startTime = Date.now();
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      res.write(
        `data: ${JSON.stringify({ event: "metadata", source: "llm_generated", similarity, vector })}\n\n`,
      );

      const routeChain = await determineRouteChain(prompt);

      const { response: generatedResponse, finalModel } =
        await streamWithFallback(prompt, routeChain, res);

      const latency = Date.now() - startTime;
      // console.log(`LLM Generation Complete in ${latency}ms`);

      res.write(`data: [DONE]\n\n`);
      res.end();

      if (cacheKey) {
        await redisClient.setEx(
          cacheKey,
          PROMPT_CACHE_TTL_SECONDS,
          JSON.stringify(generatedResponse),
        );
      }

      if (embedding) {
        const insertQuery = `
                    INSERT INTO semantic_cache (prompt, embedding, response) 
                    VALUES ($1, $2, $3);
                `;
        await pool.query(insertQuery, [prompt, embedding, generatedResponse]);
      }

      await logTelemetry({
        prompt,
        latency_ms: latency,
        response: generatedResponse,
        source: `llm_generated_${finalModel}`,
      });
    } catch (error) {
      console.error("Generation Error:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "LLM Generation Failed" });
      } else {
        res.write(
          `data: ${JSON.stringify({ error: "LLM Generation Failed" })}\n\n`,
        );
        res.end();
      }
    }
  },
);

export default router;
