import { ChatPromptTemplate } from "@langchain/core/prompts";

export const SLO_RECOMMENDER_PROMPT = ChatPromptTemplate.fromTemplate(`
You are a Site Reliability Engineering (SRE) expert.
Your task is to analyze the provided Kubernetes manifests and recommend 5 to 8 suitable Service Level Objectives (SLOs).

For each SLO, provide:
1. A unique ID (e.g., "slo-001").
2. A name (e.g., "API Availability").
3. A description (English) of what is being measured.
4. A suggested target percentage (e.g., 99.9). This MUST be the Availability Target (0-100), NOT the latency threshold.
5. A suggested threshold (optional, e.g., "200ms"). Return "null" if not applicable (e.g. for pure error rate).
6. A suggested time window (e.g., "30d").
7. The "Golden Signal" category: "Latency", "Traffic", "Errors", or "Saturation".
8. A "description_zh": A beginner-friendly explanation in Traditional Chinese (繁體中文). Explain WHY this metric is important and what it means for the user.

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
3. A Sloth SLO Spec (YAML) that strictly follows the Sloth v1 "prometheus/v1" specification.

User Selected SLOs:
{selected_slos}

version: "prometheus/v1"
service: "my-service"
slos:  # <--- CRITICAL: Mmake sure this key is exactly "slos", NOT "s los"
  - name: "slo-name-must-be-kebab-or-snake-case"
    objective: 99.9
    sli:
      events:
        error_query: "sum(rate(...))"
        total_query: "sum(rate(...))"
    alerting:
      name: AlertName
      labels:
        category: "availability"
      page_alert:
        labels:
          severity: critical
      ticket_alert:
        labels:
          severity: warning

Ensure the PromQL queries are valid and follow best practices.
IMPORTANT: For PromQL queries in the Sloth Spec:
1. You MUST use the Sloth template variable '{{{{ .window }}}}' for the time ranges.
2. Choose the correct SLI type:
   - Use 'events' for Counter metrics.
   - Use 'raw' ('error_ratio_query') for Gauge/Ratio metrics.
3. **CRITICAL**: Enclose the PromQL query in SINGLE QUOTES ('...') in the YAML to avoid escaping issues with double quotes inside the query.
   - CORRECT: error_query: 'sum(rate(my_metric{{label="value"}}[{{{{ .window }}}}]))'
   - WRONG: error_query: "sum(rate(my_metric{{label="value"}}[{{{{ .window }}}}]))" (This is invalid YAML)
4. Use the 'threshold' field from the input JSON (if present) for values in the query (e.g., latency > 0.2, CPU > 0.8).
5. Use the 'target' field (Availability %) for the Sloth 'objective'.

Example (Events):
  sli:
    events:
      error_query: 'sum(rate(http_requests_total{{status=~"5.."}}[{{{{ .window }}}}]))'
      total_query: 'sum(rate(http_requests_total[{{{{ .window }}}}]))'

Example (Raw - CPU > 80% is bad):
  sli:
    raw:
      error_ratio_query: 'sum(rate(container_cpu_usage_seconds_total{{job="app"}}[{{{{ .window }}}}])) / sum(machine_cpu_cores) > bool 0.8'

Assume standard metrics are available.

IMPORTANT: For the Sloth YAML 'name' field, you MUST use the provided 'sloth_id' field from the input JSON. Do NOT use the human-readable 'name' or 'id'. The 'sloth_id' has been pre-validated to ensure it contains no spaces.

Provide the output as a JSON object with three keys: "prometheus_yaml", "grafana_json", and "sloth_yaml".
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
