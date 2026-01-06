import { Annotation } from "@langchain/langgraph";

export interface SLO {
    id: string;
    name: string;
    description: string;
    target: number; // e.g., 99.9 (Availability %)
    threshold?: string | null; // Optional: e.g., "200ms", null if not applicable
    window: string; // e.g., "30d"
    golden_signal?: string; // e.g., "Latency", "Errors"
    description_zh?: string; // Traditional Chinese description for beginners
    promql_indicator?: string; // Optional: raw PromQL if generated
}

export const AgentState = Annotation.Root({
    // Input: K8s manifest files content
    k8sManifests: Annotation<string>(),

    // Output from Recommender
    recommendedSLOs: Annotation<SLO[]>(),

    // Selection from User (via Ink UI)
    selectedSLOs: Annotation<SLO[]>(),

    // Output Artifacts
    generatedRules: Annotation<string>(), // Prometheus Rule YAML
    generatedDashboard: Annotation<string>(), // Grafana Dashboard JSON
    generatedSlothSpec: Annotation<string>(), // Sloth YAML Spec

    // Feedback / Optimization Loop
    prometheusUrl: Annotation<string>(), // Input: URL for Prometheus
    metricsData: Annotation<string>(), // Input/Fetched: Raw metrics data or query results
    optimizationReport: Annotation<string>(), // Output: Markdown report from LLM

    // Quick Observability Mode (Phase 16)
    appName: Annotation<string>(), // Input: Application name
    namespace: Annotation<string>(), // Input: Kubernetes namespace
    discoveredMetrics: Annotation<string[]>(), // Output: List of metric names from Prometheus
    userObservabilityGoal: Annotation<string>(), // Input: User's description of what they want to observe
    recommendedMetrics: Annotation<string[]>(), // Output: AI-selected metrics (3-4)
    quickDashboard: Annotation<string>(), // Output: Generated Grafana Dashboard JSON
});
