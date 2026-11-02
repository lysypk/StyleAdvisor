# LLM Observability Research (Langfuse vs Opik vs Phoenix)

## Why consider it here?
This app makes local AI calls (Ollama text choices + vision OCR). Observability helps debug empty/slow responses, track prompts/rules versions, and compare outcomes. Given local models, privacy/cost differ from cloud LLMs.

## Langfuse
- What: open-source LLM observability (tracing, evals, prompts), MIT-licensed self-hostable.
- Setup: cloud (free Hobby plan, 50k units/month, 2 users, 30-day access) or self-host via Docker Compose/Kubernetes. Langfuse same stack as cloud; can run fully offline/VPC.
- Cost: free self-host (infra costs only); cloud free tier + paid plans.
- Fit: good if you need prompt management, evaluators, cloud parity; heavier infra (Postgres/ClickHouse/Redis/blob storage).

## Opik (Comet)
- What: open-source LLM tracing/evals/optimization.
- Setup: free cloud or self-host via one-line Docker scripts (`opik.sh`/`opik.ps1`), local endpoint 5173. Python/TS SDKs. Strong dashboard/experiments.
- Cost: open-source full platform free; cloud free 25k spans/month/60-day retention; Pro $19/mo.
- Fit: good open-source, easy local start; user management only in paid/cloud, self-host has no user mgmt.

## Arize Phoenix
- What: open-source LLM observability & agent evaluation; single-container (SQLite default, PostgreSQL prod), easy local run.
- Setup: pip package, one-line tracer provider (`register`), captures OpenAI/Anthropic/LangChain calls; TypeScript support via OTLP.
- Cost: free open-source self-hosted; no usage bill; infra cost only (minimal single container).
- Fit: lightest setup for local dev, strong RAG/agent tracing/evals; fewer prompt-management features than Langfuse.

## Recommendation for this app
- Start with **Arize Phoenix** (simplest, low VRAM/RAM overhead) or **Opik** if you want experiments/datasets.
- **Langfuse** when you need prompt management + larger team/cloud parity.
- All three can be self-hosted on local hardware (Windows PC with Docker); Opik/ Phoenix are quickest locally, Langfuse needs more infra.
- For now, keep lightweight debug logging in app first; add observability later if debugging AI quality becomes a bottleneck.

## No-Docker options
- **Arize Phoenix**: run without Docker via `uvx arize-phoenix serve` (or `python -m pip install arize-phoenix && phoenix serve`); free local server on :6006; no cloud account.
- **Opik**: cloud free tier (25k spans/month, 60-day retention) with no infra; no Docker required.
- **Langfuse**: cloud Hobby free tier (50k units/month, 2 users, 30-day retention) without Docker.
- Thus, any of the three can be used without Docker; prefer Phoenix (terminal self-host) if fully offline, Opik/Langfuse (cloud free tiers) if minimal maintenance.
