import type { NextFunction, Request, Response } from "express";
import { getEmbedding } from "../services/vector.js";
import pool from "../services/postgres.js";
import redisClient from "../services/redis.js";
import { logTelemetry } from "../services/telemetry.js";

export const checkSemanticCache = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { prompt } = req.body;
  const PROMOTED_QUERY_CACHE_TTL_SECONDS = 1 * 60 * 60; // 1 hour in seconds
  
  try {
    // console.log("L1 Miss. Checking L2 Semantic Cache...");
    const startTime = Date.now();
    const embedding = await getEmbedding(prompt);

    const embeddingString = `[${embedding.join(",")}]`;

    const result = await pool.query(
      `SELECT id, response,
              1 - (embedding <=> $1::vector) AS similarity
       FROM semantic_cache
       WHERE expires_at > NOW()
         AND 1 - (embedding <=> $1::vector) > 0.85
       ORDER BY embedding <=> $1::vector ASC
       LIMIT 1;`,
      [embeddingString]
    );

    if (result.rows.length > 0) {
      const match = result.rows[0];
      req.body.similarity = match.similarity;

      // console.log(
      //   `Top Semantic Match Score: ${(match.similarity * 100).toFixed(2)}%`,
      // );

      if (match.similarity > 0.85) {
        const latency = Date.now() - startTime;
        // console.log(`Cache Hit! Served from PostgreSQL`);

        // Reset TTL on hit — entry stays alive as long as it keeps being used
        await pool.query(
            `UPDATE semantic_cache
             SET expires_at = NOW() + INTERVAL '24 hours'
             WHERE id = $1;`,
            [match.id]
        );

        if (req.body.cacheKey) {
          await redisClient.setEx(
            req.body.cacheKey,
            PROMOTED_QUERY_CACHE_TTL_SECONDS,
            JSON.stringify(match.response),
          );
          // console.log(`Promoted L2 Semantic Hit to L1 Redis Cache`);
        }

        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        const metadataPacket = {
          event: "metadata",
          source: "postgres_semantic_cache",
          similarity: match.similarity,
          vector: embedding.slice(0, 15),
        };

        // Streaming the Response via SSE
        res.write(`data: ${JSON.stringify(metadataPacket)}\n\n`);
        res.write(`data: ${JSON.stringify({ text: match.response })}\n\n`);
        res.write(`data: [DONE]\n\n`);
        res.end();

        await logTelemetry({
          prompt: prompt,
          response: match.response,
          source: "postgres_semantic_cache",
          latency_ms: latency,
          similarity_score: match.similarity,
        });
        return;
        // } else {
        //   console.log(`Match too low. Forwarding to LLM...`);
        // }
      }
    }

    req.body.embedding = embeddingString;
    req.body.vector = embedding.slice(0, 15);
    next();
  } catch (error) {
    console.error("Semantic Cache Error:", error);
    next();
  }
};
