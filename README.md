# 🧠 LLM AWARE API

> A semantic-aware LLM gateway with Redis exact-match caching, PostgreSQL/pgvector semantic cache, streaming fallback, and dashboard telemetry.

This repository has two primary applications:
* `gateway/` — Express API server that handles prompt routing, exact/semantic caching, model fallback streaming, and telemetry logging.
* `client/` — Next.js frontend for prompt entry, live streamed responses, and telemetry visualization.

---

## 🚀 What the project does

* Receives prompt submissions from the client at `POST /api/generate`.
* An Redis-backed Sliding Window Rate Limiter ensures there is no spamming.
* Applies a Redis-backed exact-match cache first.
* If the prompt misses, generates embeddings and performs semantic similarity search in PostgreSQL/pgvector.
* Streams generated tokens back to the browser via Server-Sent Events (SSE).
* Routes prompts through intent-based model chains and retries with fallback targets.
* Stores telemetry in MongoDB and exposes telemetry endpoints at `/api/telemetry`.

---

## 🧩 Repo structure

* `client/` — Next.js frontend served on port `3001` in development.
* `gateway/` — Node.js backend served on port `3000` in development.
* `gateway/src/middleware` — rate limiting, exact-match cache checks, semantic cache logic, and payload validation.
* `gateway/src/services` — Redis, Postgres, Mongo, embedding, routing, and LLM provider services.
* `gateway/src/routes` — API route handlers for generation and telemetry.

---

## 🛠️ Tech stack

* Frontend: `Next.js`, `React`, `TypeScript`.
* Backend: `Node.js`, `Express`, `TypeScript`.
* Exact cache: `Redis`.
* Semantic cache: `PostgreSQL` + `pgvector`.
* Telemetry: `MongoDB`.
* LLM providers: `Groq`, `Hugging Face`, and local `Ollama`.

---

## 🔌 Required environment variables

* `DATABASE_URL` — PostgreSQL connection string.
* `REDIS_URL` — Redis connection string.
* `MONGO_URI` — MongoDB connection string.
* `GROQ_API_KEY` — Groq API key used for router and Groq LLM calls.
* `HUGGINGFACE_API_KEY` — Hugging Face API key used for Qwen coder and production embeddings.
* `OLLAMA_BASE_URL` — Optional local Ollama URL (defaults to `http://localhost:11434`).
* `NODE_ENV` — `development` or `production`.
* `PORT` — Optional gateway port (defaults to `3000`).

---

## 📦 Local development steps

### Install dependencies

```bash
cd gateway
npm install
cd ../client
npm install
```

### Start the gateway

```bash
cd gateway
npm run dev
```

The gateway exposes:
* `POST /api/generate`
* `GET /api/telemetry`
* `GET /api/telemetry/stats`
* `GET /api/health`

### Start the frontend

```bash
cd client
npm run dev
```

The client expects the gateway to be available at `http://localhost:3000` and runs on `http://localhost:3001`.

---

## ⚙️ Model routing and provider behavior

* `gateway/src/services/router.ts` determines the model chain by prompt intent and environment.
* In production, `local_llama3` is excluded and only cloud targets are used.
* `gateway/src/services/llm.ts` supports:
  * `hf_coder` — Hugging Face `Qwen/Qwen2.5-Coder-7B-Instruct`
  * `cloud_llama_70b` — Groq `llama-3.3-70b-versatile`
  * `cloud_llama_8b` — Groq `llama-3.1-8b-instant`
  * `local_llama3` — Ollama `llama3.2`

---

## 🧠 Semantic caching behavior

* Exact-match caching is handled by Redis.
* Semantic cache is stored in PostgreSQL in the `semantic_cache` table with `prompt`, `embedding`, `response`, and `expires_at`.
* `pgvector` is initialized with an HNSW index for cosine similarity search.
* The semantic cache middleware promotes semantic hits back into Redis for faster repeated access.
* There is Sliding Window TTL implementation to prevent both Redis and pg vector from flooding with queries and vector embeddings.

---

## 🚧 Local embedding mode

When `NODE_ENV` is not `production`, `gateway/src/services/vector.ts` calls `http://localhost:8000/embed` for embeddings. In production, it uses Hugging Face embeddings via `HUGGINGFACE_API_KEY`.

---

## ✅ Quick start

```bash
cd gateway
npm run dev
cd ../client
npm run dev
```

Then open `http://localhost:3001`.

---

## 📄 License

This project is licensed under the terms in `LICENSE`.
