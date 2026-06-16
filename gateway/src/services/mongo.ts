import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

export const connectMongo = async () => {

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error("MONGO_URI environment variable is not set");
  }
  mongoose.set("bufferCommands", false);
  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log("Connected to MongoDB (Telemetry Data Lake)");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw new Error("Failed to connect to MongoDB for telemetry logging");
  }
};

const telemetrySchema = new mongoose.Schema({
  prompt: { type: String, required: true },
  response: { type: String, required: true },
  source: {
    type: String,
    enum: [
      "redis_cache",
      "postgres_semantic_cache",
      "llm_generated_hf_coder",
      "llm_generated_cloud_llama_70b",
      "llm_generated_cloud_llama_8b",
      "llm_generated_local_llama3",
    ],
    required: true,
  },
  latency_ms: { type: Number, required: true },
  similarity_score: { type: Number, required: false },
  timestamp: { type: Date, default: Date.now },
});

export const TelemetryLog = mongoose.model("TelemetryLog", telemetrySchema);
