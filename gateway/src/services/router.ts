// hf_coder: A specialized model tuned for coding and DevOps.
// cloud_llama_70b: A massive, highly intelligent (but slow and expensive) cloud model.
// cloud_llama_8b: A smaller, faster, and cheaper cloud model.
// local_llama3: A model running locally on the developer's machine (free, but relies on local hardware).

import dotenv from 'dotenv';
import { ChatGroq } from '@langchain/groq';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
dotenv.config();

export type ModelTarget = 'hf_coder' | 'cloud_llama_70b' | 'cloud_llama_8b' | 'local_llama3';

const ROUTER_MODEL = 'llama-3.1-8b-instant';
const MODEL_TARGETS: ModelTarget[] = ['hf_coder', 'cloud_llama_70b', 'cloud_llama_8b', 'local_llama3'];
const CLOUD_MODEL_TARGETS: ModelTarget[] = ['hf_coder', 'cloud_llama_70b', 'cloud_llama_8b'];

const routerModel = process.env.GROQ_API_KEY
    ? new ChatGroq({
        apiKey: process.env.GROQ_API_KEY,
        model: ROUTER_MODEL,
        temperature: 0.4,
        maxTokens: 80,
    })
    : null;

const ROUTER_SYSTEM_PROMPT = `
You are the routing classifier for an LLM gateway.
Return only a JSON array of model ids in descending priority order. No markdown, no object, no explanation.

Allowed model ids:
- hf_coder: best for code, Docker, DevOps, shell, TypeScript, React, Kubernetes, debugging, scripts.
- cloud_llama_70b: best for hard reasoning, math, analysis, strict JSON/structured output, complex instructions.
- cloud_llama_8b: best for fast general answers, summaries, short tasks, casual questions, and creative writing.
- local_llama3: local development only; useful for simple/general prompts or as a cheap local fallback.

Routing hints:
- If the prompt is about code, bash, Docker, AWS, scripts, React, TypeScript, Kubernetes, DevOps, or debugging, prioritize hf_coder.
- If the prompt asks for calculations, equations, deep reasoning, strict JSON, arrays, objects, schemas, or exact structure, prioritize cloud_llama_70b.
- If the prompt is creative, conversational, short, or general knowledge, prioritize cloud_llama_8b in production.
- If environment is local_development and the prompt is simple/general, local_llama3 can be first.
- Never include local_llama3 when environment is production.
- Include 2 or 3 models when possible so the gateway has fallback options.
- Don't include any different model ids that aren't in the allowed list.

Example response:
["cloud_llama_70b","cloud_llama_8b"]
`.trim();

const getEnvironmentName = (): 'production' | 'local_development' => {
    return process.env.NODE_ENV === 'production' ? 'production' : 'local_development';
};

const isModelTarget = (value: unknown): value is ModelTarget => {
    return typeof value === 'string' && MODEL_TARGETS.includes(value as ModelTarget);
};

const parseRouteArray = (content: string): unknown[] => {
    try {
        const parsed = JSON.parse(content);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        const arrayMatch = content.match(/\[[\s\S]*\]/);
        if (!arrayMatch) return [];

        try {
            const parsed = JSON.parse(arrayMatch[0]);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }
};

const sanitizeRouteChain = (
    candidateRoute: unknown[],
    environment: 'production' | 'local_development',
): ModelTarget[] => {
    const allowedTargets = environment === 'production' ? CLOUD_MODEL_TARGETS : MODEL_TARGETS;
    const route: ModelTarget[] = [];

    for (const target of candidateRoute) {
        if (isModelTarget(target) && allowedTargets.includes(target) && !route.includes(target)) {
            route.push(target);
        }
    }

    return route;
};

const determineRegexRouteChain = (prompt: string): ModelTarget[] => {
    const isProd = process.env.NODE_ENV === 'production';
    const normalizedPrompt = prompt.toLowerCase();

    if (normalizedPrompt.match(/(bash|docker|aws|script|react|typescript|kubernetes|devops|code)/)) {
        return isProd
            ? ['hf_coder', 'cloud_llama_70b', 'cloud_llama_8b']
            : ['hf_coder', 'cloud_llama_70b', 'local_llama3'];
    }

    const requiresJSON = /json|array|object|structure format/.test(normalizedPrompt);
    const containsCodeSyntax = /```|function|const|let|=>|class|interface|npm install|react/.test(normalizedPrompt);
    const isMath = /calculate|equation|solve|derivative|math/.test(normalizedPrompt);

    if (containsCodeSyntax || requiresJSON || isMath) {
        // Primary: Smartest cloud model. 
        // Fallback 1: Fast cloud model. 
        // Fallback 2: Local model (if not in prod).
        return isProd 
            ? ['cloud_llama_70b', 'cloud_llama_8b'] 
            : ['cloud_llama_70b', 'cloud_llama_8b', 'local_llama3'];
    }

    const isCreative = /write a story|compose|essay|blog|creative/.test(normalizedPrompt);
    const isLongContext = prompt.length > 400;

    if (isCreative || isLongContext) {
        return isProd 
            ? ['cloud_llama_8b', 'cloud_llama_70b'] 
            : ['cloud_llama_8b', 'cloud_llama_70b', 'local_llama3'];
    }

    return isProd 
        ? ['cloud_llama_8b', 'cloud_llama_70b'] 
        : ['local_llama3', 'cloud_llama_8b']; 
};

export const determineRouteChain = async (prompt: string): Promise<ModelTarget[]> => {
    const environment = getEnvironmentName();

    if (!routerModel) {
        return determineRegexRouteChain(prompt);
    }

    try {
        const response = await routerModel.invoke([
            new SystemMessage(ROUTER_SYSTEM_PROMPT),
            new HumanMessage(JSON.stringify({ environment, prompt })),
        ]);

        const content = typeof response.content === 'string'
            ? response.content
            : '';
        const candidateRoute = parseRouteArray(content);
        const routeChain = sanitizeRouteChain(candidateRoute, environment);

        if (routeChain.length > 0) {
            return routeChain;
        }

        console.warn('LLM Router returned no usable route. Falling back to regex router.');
        return determineRegexRouteChain(prompt);
    } catch (error) {
        console.error(
            'LLM Router Error:',
            error instanceof Error ? error.message : error,
        );
        return determineRegexRouteChain(prompt);
    }
};
