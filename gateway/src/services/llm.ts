import type { Response } from 'express';
import type { AIMessageChunk } from '@langchain/core/messages';
import { ChatGroq } from '@langchain/groq';
import { ChatOllama } from '@langchain/ollama';
import { ChatOpenAI } from '@langchain/openai';
import type { ModelTarget } from './router.js';
import dotenv from 'dotenv';

dotenv.config();

// All providers are BaseChatModel — they share the same stream interface.
type ChatModel = ChatOpenAI | ChatGroq | ChatOllama;

const GROQ_MODELS = {
    cloud_llama_70b: 'llama-3.3-70b-versatile',
    cloud_llama_8b: 'llama-3.1-8b-instant',
} as const;

const HF_CODER_MODEL = 'Qwen/Qwen2.5-Coder-7B-Instruct';
const HF_INFERENCE_BASE_URL = 'https://router.huggingface.co/v1';
const LOCAL_LLAMA_MODEL = 'llama3.2';
const DEFAULT_OLLAMA_BASE_URL = 'http://localhost:11434';

const getRequiredEnv = (name: string): string => {
    const value = process.env[name];
    if (!value) {
        throw new Error(`${name} environment variable is required for this model`);
    }

    return value;
};

const createModel = (target: ModelTarget): ChatModel => {
    if (target === 'hf_coder') {
        return new ChatOpenAI({
            apiKey: getRequiredEnv('HUGGINGFACE_API_KEY'),
            model: HF_CODER_MODEL,
            temperature: 0.2,
            maxTokens: 2048,
            configuration: {
                baseURL: HF_INFERENCE_BASE_URL,
            },
        });
    }

    if (target === 'cloud_llama_70b' || target === 'cloud_llama_8b') {
        return new ChatGroq({
            apiKey: getRequiredEnv('GROQ_API_KEY'),
            model: GROQ_MODELS[target],
            temperature: 0.2,
        });
    }

    return new ChatOllama({
        model: LOCAL_LLAMA_MODEL,
        baseUrl: process.env.OLLAMA_BASE_URL ?? DEFAULT_OLLAMA_BASE_URL,
        temperature: 0.2,
    });
};

// All chat models return AIMessageChunk — .content is always a string for these providers.
const extractText = (chunk: AIMessageChunk): string => {
    return typeof chunk.content === 'string' ? chunk.content : '';
};

const attemptStream = async (
    prompt: string,
    target: ModelTarget,
    res: Response,
): Promise<string> => {
    const model = createModel(target);
    const stream = await model.stream(prompt);
    let fullResponse = '';

    for await (const chunk of stream) {
        const token = extractText(chunk);
        if (!token) continue;

        fullResponse += token;
        res.write(`data: ${JSON.stringify({ text: token })}\n\n`);
    }

    return fullResponse;
};

export const streamWithFallback = async (
    prompt: string,
    routeChain: ModelTarget[],
    res: Response,
): Promise<{ response: string; finalModel: string }> => {
    for (let i = 0; i < routeChain.length; i++) {
        const targetModel = routeChain[i];

        if (!targetModel) continue;

        try {
            res.write(
                `data: ${JSON.stringify({ event: 'metadata', source: `llm_generated_${targetModel}` })}\n\n`,
            );

            const generatedText = await attemptStream(prompt, targetModel, res);

            return { response: generatedText, finalModel: targetModel };
        } catch (error) {
            console.error(
                `Model ${targetModel} failed:`,
                error instanceof Error ? error.message : error,
            );

            if (i === routeChain.length - 1) {
                console.error('All fallback models exhausted. System offline.');
                throw new Error('All LLM providers failed.');
            }

            res.write(
                `data: ${JSON.stringify({ event: 'fallback_triggered', failed_model: targetModel, next_model: routeChain[i + 1] })}\n\n`,
            );
        }
    }

    throw new Error('Unexpected fallback failure');
};
