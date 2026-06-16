import { TelemetryLog } from "./mongo.js";

interface LogPayload {
    prompt: string;
    response: string;
    source: string;
    latency_ms: number;
    similarity_score?: number;
}

export const logTelemetry = async (data: LogPayload) => {
    try {
        // const doc = await TelemetryLog.create(data);
        // console.log('Mongoose saved telemetry log with ID:', doc._id);
        await TelemetryLog.create(data);
    } catch (err) {
        console.error('Mongoose failed to save! Reason:', err);
    }
};