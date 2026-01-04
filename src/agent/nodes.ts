import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import * as dotenv from "dotenv";
import { SLO_RECOMMENDER_PROMPT, ARTIFACT_GENERATOR_PROMPT, SLO_OPTIMIZER_PROMPT } from "./prompts.js";
import { AgentState, SLO } from "./state.js";
import { logger } from "../utils/logger.js";

dotenv.config();

const model = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temperature: 0,
});

// Schema for SLO Recommendation
const SLOSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    target: z.number(),
    window: z.string(),
    golden_signal: z.string().describe("One of: Latency, Traffic, Errors, Saturation"),
    description_zh: z.string().describe("A beginner-friendly explanation in Traditional Chinese"),
});

const RecommendationOutput = z.object({
    slos: z.array(SLOSchema),
});

// Node: Recommend SLOs
export const recommendSLOsNode = async (state: typeof AgentState.State) => {
    logger.log("Analyzing K8s manifests...", "ai", { k8sManifests: state.k8sManifests });
    logger.log(`Manifest content length: ${state.k8sManifests.length} chars`, "info");

    const chain = SLO_RECOMMENDER_PROMPT.pipe(model.withStructuredOutput(RecommendationOutput));

    // Log the full prompt
    const formattedPrompt = await SLO_RECOMMENDER_PROMPT.format({
        k8s_manifests: state.k8sManifests
    });
    logger.log(`Generated Prompt for Recommender`, "info", { fullPrompt: formattedPrompt });

    const result = await chain.invoke({
        k8s_manifests: state.k8sManifests,
    });

    logger.log(`Received ${result.slos.length} recommendations from LLM.`, "ai", { recommendedSLOs: result.slos });

    return {
        recommendedSLOs: result.slos,
    };
};

// Schema for Artifact Generation
const ArtifactsOutput = z.object({
    prometheus_yaml: z.string(),
    grafana_json: z.string(),
});

// Node: Generate Artifacts
export const generateArtifactsNode = async (state: typeof AgentState.State) => {
    logger.log("Generating Prometheus Rules and Grafana Dashboard...", "ai", { selectedSLOs: state.selectedSLOs });
    const chain = ARTIFACT_GENERATOR_PROMPT.pipe(model.withStructuredOutput(ArtifactsOutput));

    const formattedPrompt = await ARTIFACT_GENERATOR_PROMPT.format({
        selected_slos: JSON.stringify(state.selectedSLOs, null, 2),
    });
    logger.log(`Generated Prompt for Artifact Generation`, "info", { fullPrompt: formattedPrompt });

    const result = await chain.invoke({
        selected_slos: JSON.stringify(state.selectedSLOs, null, 2),
    });

    logger.log("Artifacts generated successfully.", "ai", { generatedRules: result.prometheus_yaml, generatedDashboard: result.grafana_json });

    return {
        generatedRules: result.prometheus_yaml,
        generatedDashboard: result.grafana_json,
    };
};

// Node: Analyze & Optimize (Optimization Loop)
export const optimizeSLOsNode = async (state: typeof AgentState.State) => {
    logger.log("Analyzing metrics and optimizing SLOs...", "ai", { metricsData: state.metricsData });
    const chain = SLO_OPTIMIZER_PROMPT.pipe(model);

    let fullContent = "";

    // Log the full prompt
    const formattedPrompt = await SLO_OPTIMIZER_PROMPT.format({
        metrics_data: state.metricsData || "No specific metrics provided, please perform general audit based on best practices.",
    });
    logger.log(`Generated Prompt for Optimization`, "info", { fullPrompt: formattedPrompt });

    const stream = await chain.stream({
        metrics_data: state.metricsData || "No specific metrics provided, please perform general audit based on best practices.",
    });

    for await (const chunk of stream) {
        const token = chunk.content as string;
        fullContent += token;
        logger.stream(token);
    }

    logger.log("Optimization analysis completed.", "ai", { optimizationReport: fullContent });

    return {
        optimizationReport: fullContent,
    };
};
