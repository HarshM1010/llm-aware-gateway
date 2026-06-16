# 🧠 LLM AWARE Gateway

> An Enterprise-Grade Semantic LLM Router, Caching Layer, and Telemetry Engine.

LLM AWARE Gateway is a distributed, high-availability AI orchestration layer designed to drastically reduce LLM inference costs and API latency. By decoupling the edge UI from the heavy compute and implementing a multi-tiered semantic caching system, LLM AWARE Gateway ensures sub-millisecond response times for redundant queries while maintaining 100% uptime through advanced circuit-breaking and model fallbacks.



---

## 🚀 Core Architecture & Features

### 1. Multi-Tiered Intelligent Caching
Why pay for the same LLM generation twice? Memoria implements a two-step caching engine to eliminate redundant API calls:
* **L1 Edge Cache (Redis):** Provides **0ms latency** for exact-match prompt hits.
* **L2 Semantic Cache (PostgreSQL + pgvector):** Utilizes `BAAI/bge-small-en-v1.5` embeddings to perform mathematical similarity searches. If a user asks a question worded differently but with the exact same intent as a previous query, the gateway serves the cached response instantly.

### 2. Semantic Router
Not all prompts require a massive 70B parameter model. LLM AWARE Gateway intercepts incoming requests, analyzes the intent, and dynamically routes the prompt to specialized, purpose-built LLMs to optimize compute costs and speed:
* **Math & Complex Logic:** Routed to heavy compute models (e.g., LLaMA-3.3-70B).
* **DevOps & Code:** Routed to specialized coding models (e.g., Qwen2.5-Coder).
* **Creative & General:** Routed to lightning-fast, lightweight models (e.g., LLaMA-3.1-8B).

### 3. Fault-Tolerant Cascading Fallbacks 
Built for production reliability. If the primary LLM provider (e.g., Groq) experiences a rate limit (`429`) or outage (`503`), the Gateway automatically catches the failure and seamlessly reroutes the streaming connection to a fallback provider (Hugging Face) without disrupting the user experience.

### 4. Sliding Window Rate Limiter
Protects the API from abuse and DDoS attacks using a Redis-backed sliding window algorithm, ensuring fair usage and protecting underlying LLM API quotas.

### 5. Asynchronous SSE Telemetry
Streams tokens to the client via Server-Sent Events (SSE) for a real-time typing effect, while asynchronously firing non-blocking telemetry data (Time-To-First-Token, tokens-per-second, cache hit ratios, and model routing decisions) to a NoSQL database for real-time dashboard observability.

---

## 🛠️ Technology Stack

| Category | Technology | Purpose |
| :--- | :--- | :--- |
| **Edge / UI** | Next.js, React, Tailwind | Server-side rendered dashboard and telemetry visualization. |
| **Compute Gateway** | Node.js, Express, TypeScript | Stateless API routing, stream handling, and intent parsing. |
| **L1 State** | Redis (Upstash) | High-speed, exact-match string caching and rate limiting. |
| **L2 Vector State** | PostgreSQL + pgvector (Neon) | Semantic similarity searching and embedding storage. |
| **Telemetry State** | MongoDB (Atlas) | High-throughput, unstructured log and metric ingestion. |
| **Embeddings** | Hugging Face Inference API | Cloud-native vectorization (`BAAI/bge-small`). |

---

## 🤖 Model Ecosystem

LLM AWARE Gateway supports dual environments: a fully local, air-gapped development environment and a distributed, high-performance cloud production environment.

| Intent / Role | Local (Development) | Cloud (Production) | Provider |
| :--- | :--- | :--- | :--- |
| **Heavy Logic** | `llama3.2` (Ollama) | `llama-3.3-70b-versatile` | Groq |
| **Creative / Fast** | `llama3.2` (Ollama) | `llama-3.1-8b-instant` | Groq |
| **DevOps & Code** | `qwen2.5:7b` (Ollama) | `Qwen2.5-Coder-7B-Instruct` | Hugging Face |
| **Fallback Node** | `llama3.2` (Ollama) | `Qwen2.5-Coder-7B-Instruct` | Hugging Face |
| **Embeddings** | Python FastAPI Worker | `BAAI/bge-small-en-v1.5` | Hugging Face |

---

## 🌍 Cloud Deployment Strategy

The production infrastructure is globally distributed but regionally optimized. The Gateway and all managed databases are strictly collocated in the **Singapore (`ap-southeast-1`)** region to achieve low internal network latency.

* **Frontend Interface:** Deployed on **Vercel** (Global Edge Network).
* **API Gateway:** Deployed on **Render** (Singapore Node).
* **Redis Cluster:** Managed via **Upstash** (AWS Singapore).
* **Vector Database:** Managed via **Neon.tech** (AWS Singapore).
* **Telemetry Logs:** Managed via **MongoDB Atlas** (AWS Singapore).

---

## 💻 Local Setup & Development

To run the entire Memoria architecture on your local machine using Docker and Ollama:

### 1. Prerequisites
* Node.js (v18+)
* Docker & Docker Compose
* Ollama (with `llama3.2` and `qwen2.5:7b` downloaded locally)

### 2. Environment Variables (`.env`)
Create a `.env` file in the root directory:
```env
# Database Credentials
POSTGRES_USER=admin
POSTGRES_PASSWORD=password123
POSTGRES_DB=llm_aware_gateway_db
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
REDIS_URL=redis://localhost:6379
MONGO_URI=mongodb://admin:password123@127.0.0.1:27017/llm_aware_gateway_logs?authSource=admin

# API Keys (For Cloud Fallbacks & Embeddings)
GROQ_API_KEY=your_groq_key
HUGGINGFACE_API_KEY=your_hf_key

# Environment
NODE_ENV=development
```

### 3. Spin up the Infrastructure
Use Docker Compose to boot up Postgres, Redis, MongoDB, and the local Python Embedding worker all at once:
```bash
docker-compose up -d
```

### 4. Start the Gateway & Frontend
Open two separate terminal windows:

**Terminal 1: Start the Node.js API Gateway**
```bash
cd gateway
npm install
npm run dev
```

**Terminal 2: Start the Next.js Dashboard**
```bash
cd frontend
npm install
npm run dev
```

Navigate to `http://localhost:3000` to access the LLM AWARE Gateway control panel.
