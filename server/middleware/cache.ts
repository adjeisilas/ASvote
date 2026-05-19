import { Request, Response, NextFunction } from "express";
import NodeCache from "node-cache";

// Initialize cache with a 5-minute default TTL (Time To Live)
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

/**
 * Middleware to cache API responses
 * @param duration Seconds to cache the response
 */
export const cacheMiddleware = (duration?: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== "GET") {
      return next();
    }

    const key = req.originalUrl || req.url;
    const cachedResponse = cache.get(key);

    if (cachedResponse) {
      console.log(`Cache hit for ${key}`);
      return res.send(cachedResponse);
    }

    console.log(`Cache miss for ${key}`);

    // Override res.send to store the response in cache
    const originalSend = res.send;
    res.send = (body: any): Response => {
      // Only cache successful JSON responses
      if (res.statusCode === 200) {
        if (duration !== undefined) {
          cache.set(key, body, duration);
        } else {
          cache.set(key, body);
        }
      }
      return originalSend.call(res, body);
    };

    next();
  };
};

export default cache;
