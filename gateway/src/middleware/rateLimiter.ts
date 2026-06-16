import type { Request, Response, NextFunction } from "express";
import redisClient from "../services/redis.js";

const WINDOW_SIZE_IN_SECONDS = 60;
const MAX_REQUESTS_PER_WINDOW = 15;

export const rateLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const ip = req.ip || req.socket.remoteAddress || "unknown_ip";
    const key = `rate_limit:${ip}`;

    const now = Date.now();
    const windowStart = now - WINDOW_SIZE_IN_SECONDS * 1000;

    const multi = redisClient.multi();

    multi.zRemRangeByScore(key, 0, windowStart);

    const value = `${now}-${Math.random().toString(36).substring(2, 7)}`;
    multi.zAdd(key, [{ score: now, value }]);

    multi.zCard(key);

    multi.expire(key, WINDOW_SIZE_IN_SECONDS);

    const results = await multi.exec();

    const requestCount = (results[2] as unknown) as number;

    if (requestCount > MAX_REQUESTS_PER_WINDOW) {
      redisClient.zRem(key, value).catch(console.error);
      console.warn(`Rate limit hit for IP: ${ip} (${requestCount} requests)`);
      res.status(429).json({
        error: "Too Many Requests",
        message: `You have exceeded the ${MAX_REQUESTS_PER_WINDOW} requests per ${WINDOW_SIZE_IN_SECONDS} seconds limit. Please wait a moment.`,
      });
      return;
    }

    next();
  } catch (error) {
    console.error("Redis Rate Limiter Error:", error);
    next();
  }
};


//fixed window 

// export const rateLimiter = async (req: Request, res: Response, next: NextFunction) => {
//     const ip = req.ip || req.socket.remoteAddress || 'unknown';

//     const limit = 10;
//     const windowInSeconds = 60;

//     try{
//         const requests = await redisClient.incr(ip);

//         if (requests === 1) {
//             await redisClient.expire(ip, windowInSeconds);
//         }

//         if (requests > limit) {
//             res.status(429).json({ message: 'Too many requests. Please try again in a minute.', status: 429 });
//             return;
//         }
//         next();
//     }catch (err) {
//         console.error('Error in rate limiter:', err);
//         next();
//     }
// };