import { ChatPromptTemplate } from "@langchain/core/prompts";

export const SLO_RECOMMENDER_PROMPT = ChatPromptTemplate.fromTemplate(`
You are a Site Reliability Engineering (SRE) expert.
Your task is to analyze the provided Kubernetes manifests and recommend 5 to 8 suitable Service Level Objectives (SLOs).

For each SLO, provide:
1. A unique ID (e.g., "slo-001").
2. A name (e.g., "API Availability").
3. A description (English) of what is being measured.
4. A suggested target percentage (e.g., 99.9).
5. A suggested time window (e.g., "30d").
6. The "Golden Signal" category: "Latency", "Traffic", "Errors", or "Saturation".
7. A "description_zh": A beginner-friendly explanation in Traditional Chinese (繁體中文). Explain WHY this metric is important and what it means for the user.

Focus on Golden Signals: Latency, Traffic, Errors, and Saturation.
Consider the type of resource (Deployment, Service, Ingress, StatefulSet) in the manifests.

K8s Manifests:
{k8s_manifests}

Output strictly in JSON format matching the schema.
`);

export const ARTIFACT_GENERATOR_PROMPT = ChatPromptTemplate.fromTemplate(`
You are an expert in Prometheus and Grafana.
Based on the User Selected SLOs, generate:
1. A Prometheus Rule (YAML) containing recording rules and alerting rules for these SLOs.
2. A Grafana Dashboard (JSON) to visualize these SLOs.

User Selected SLOs:
{selected_slos}

Ensure the PromQL queries are valid and follow best practices.
Assume standard metrics are available (e.g., kube-state-metrics, ingress-nginx, or typical application metrics 'http_requests_total', 'container_cpu_usage_seconds_total').
If specific metric names are unknown, use placeholders like 'http_requests_total{{job="app"}}' but try to be as generic as possible for K8s.

Provide the output as a JSON object with two keys: "prometheus_yaml" and "grafana_json".
`);

export const SLO_OPTIMIZER_PROMPT = ChatPromptTemplate.fromTemplate(`
You are an SRE consultant auditing existing SLOs.
Here is the current metrics data/status and the configured SLOs.

Metrics Data / Context:
{metrics_data}

Analyze the burn rate and error budget consumption.
Provide a Markdown report with:
1. Analysis of current health.
2. Recommendations for optimization (e.g., "Relax target to 99.5%", "Increase alert window").
3. Specific reasons for changes.

Keep it concise and actionable.
`);
