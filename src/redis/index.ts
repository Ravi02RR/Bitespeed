import Redis from "ioredis";

const redisClient = new Redis(process.env.REDIS_URL as string);

redisClient.on("connect", () => {
  console.log("[/src/redis/index.ts]-> Connected to Redis");
});

redisClient.on("error", (err) => {
  console.error("[/src/redis/index.ts]-> Redis error:", err);
});

export default redisClient;
