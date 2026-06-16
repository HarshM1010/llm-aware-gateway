import { Router } from "express";
import { TelemetryLog } from "../services/mongo.js";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const logs = await TelemetryLog.find()
      .sort({ timestamp: -1 })
      .limit(200)
      .lean();
    res.json(logs);
  } catch (err) {
    console.error("Telemetry fetch error:", err);
    res.status(500).json({ error: "Failed to fetch telemetry logs" });
  }
});

router.get("/stats", async (_req, res) => {
  try {
    const totalRequests = await TelemetryLog.countDocuments();

    const sourceDistribution = await TelemetryLog.aggregate([
      { $group: { _id: "$source", count: { $sum: 1 }, avgLatency: { $avg: "$latency_ms" } } },
      { $sort: { count: -1 } },
    ]);

    const latencyOverTime = await TelemetryLog.aggregate([
      { $sort: { timestamp: -1 } },
      { $limit: 50 },
      {
        $project: {
          source: 1,
          latency_ms: 1,
          timestamp: 1,
          similarity_score: 1,
        },
      },
    ]);

    const avgLatency = await TelemetryLog.aggregate([
      { $group: { _id: null, avg: { $avg: "$latency_ms" } } },
    ]);

    const cacheHitRate = await TelemetryLog.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          cacheHits: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $eq: ["$source", "redis_cache"] },
                    { $eq: ["$source", "postgres_semantic_cache"] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    const hourlyVolume = await TelemetryLog.aggregate([
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d %H:00", date: "$timestamp" },
          },
          count: { $sum: 1 },
          avgLatency: { $avg: "$latency_ms" },
        },
      },
      { $sort: { _id: -1 } },
      { $limit: 24 },
    ]);

    res.json({
      totalRequests,
      avgLatency: avgLatency[0]?.avg || 0,
      cacheHitRate:
        cacheHitRate[0]?.total > 0
          ? (cacheHitRate[0].cacheHits / cacheHitRate[0].total) * 100
          : 0,
      sourceDistribution,
      latencyOverTime: latencyOverTime.reverse(),
      hourlyVolume: hourlyVolume.reverse(),
    });
  } catch (err) {
    console.error("Telemetry stats error:", err);
    res.status(500).json({ error: "Failed to fetch telemetry stats" });
  }
});

export default router;
