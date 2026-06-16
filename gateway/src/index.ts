import express from "express";
import { connectRedis } from "./services/redis.js";
import { rateLimiter } from "./middleware/rateLimiter.js";
import dotenv from "dotenv";
import { initDB } from "./services/postgres.js";
import { connectMongo } from "./services/mongo.js";
import cors from "cors";
import generateRoute from "./routes/generate.js";
import telemetryRoute from "./routes/telemetry.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3002;  //backend port

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3001";

app.use(
  cors({
    origin: CLIENT_URL,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  }),
);

app.use(express.json());

app.use("/api/", rateLimiter);

app.use("/api/health", (_req, res) => {
  res.status(200).json({ status: 'API Gateway is awake and ready.' });
});
app.use("/api/generate", generateRoute);
app.use("/api/telemetry", telemetryRoute);

const startServer = async () => {
  await connectRedis();
  await initDB();
  await connectMongo();
  app.listen(PORT, () => {
    console.log(`API Gateway is running on port ${PORT}`);
  });
};

startServer();
