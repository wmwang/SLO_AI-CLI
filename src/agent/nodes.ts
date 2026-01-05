import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import * as dotenv from "dotenv";
import { SLO_RECOMMENDER_PROMPT, ARTIFACT_GENERATOR_PROMPT, SLO_OPTIMIZER_PROMPT } from "./prompts.js";
import { AgentState, SLO } from "./state.js";
import { logger } from "../utils/logger.js";
import { SlothRunner } from "../services/sloth_runner.js";
import * as fs from "fs";
import * as path from "path";

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
    target: z.number().describe("Availability Target % (e.g., 99.9). MUST be between 0 and 100."),
    threshold: z.string().nullable().describe("Optional threshold (e.g., '200ms'). Return null if not applicable (e.g. for simple errors)."),
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
    sloth_yaml: z.string(),
});

// Node: Generate Artifacts
export const generateArtifactsNode = async (state: typeof AgentState.State) => {
    logger.log("Generating Prometheus Rules, Grafana Dashboard, and Sloth Spec...", "ai", { selectedSLOs: state.selectedSLOs });

    // Pre-process SLOs
    const slosWithStrictIds = state.selectedSLOs.map(slo => ({
        ...slo,
        sloth_id: slo.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    }));

    const chain = ARTIFACT_GENERATOR_PROMPT.pipe(model.withStructuredOutput(ArtifactsOutput));

    // Sloth Self-Healing Loop
    let attempts = 0;
    const maxAttempts = 3;
    let lastError = "";
    let finalResult = null;

    while (attempts < maxAttempts) {
        attempts++;
        if (attempts > 1) {
            logger.log(`Retry attempt ${attempts}/${maxAttempts}. Fixing previous Sloth error...`, "ai");
        }

        // Add error context if present
        let promptInput = {
            selected_slos: JSON.stringify(slosWithStrictIds, null, 2),
        };

        // If we have an error, we need a way to pass it.
        // The current PromptTemplate might not support 'error_context' variable if strictly typed,
        // but we can append it to the JSON string or modify the prompt dynamically.
        // A cleaner way relies on the prompt handling extra inputs or just string concatenation.

        // Let's verify ARTIFACT_GENERATOR_PROMPT in prompts.ts.
        // Assuming strict variables, modifying the 'selected_slos' string is a hack but effective:
        if (lastError) {
            // Append error instruction to the input data so the LLM sees it
            promptInput.selected_slos += `\n\n[IMPORTANT] PREVIOUS GENERATION FAILED WITH SLOTH ERROR:\n${lastError}\n\nPLEASE FIX THE YAML TO RESOLVE THIS ERROR.\nHint 1: If the error is 'both error and total queries can't be the same', you MUST either change the 'error_query' to be different or switch to 'raw' SLI type.\nHint 2: If the error is 'template must contain the {{ .window }} variable', it means your PromQL missing the window parameter. For Gauge metrics (like memory/saturation), wraps the metric in 'max_over_time(...[{{ .window }}])' or 'avg_over_time(...[{{ .window }}])'.`;
        }

        const result = await chain.invoke(promptInput);
        finalResult = result;

        // Save raw spec locally for validation
        const tempSlothPath = path.join(process.cwd(), "output", "sloth.yaml");
        const tempOutPath = path.join(process.cwd(), "output", "prometheus_sloth_rules.yaml");

        if (!fs.existsSync(path.dirname(tempSlothPath))) {
            fs.mkdirSync(path.dirname(tempSlothPath), { recursive: true });
        }
        await fs.promises.writeFile(tempSlothPath, result.sloth_yaml);

        // Validation via Sloth Runner
        try {
            const slothRunner = SlothRunner.getInstance();
            const { success, error } = await slothRunner.generate(tempSlothPath, tempOutPath);

            if (success) {
                logger.log("Sloth validation and generation successful.", "info");
                break; // Exit loop on success
            } else {
                lastError = error || "Unknown Sloth error";
                logger.log(`Sloth Validation Failed: ${lastError}`, "error");
                // Continue loop
            }
        } catch (e: any) {
            logger.log(`System error during Sloth run: ${e.message}`, "error");
            lastError = e.message;
        }
    }

    if (!finalResult) {
        throw new Error("Failed to generate artifacts.");
    }

    // Log final outcome
    if (lastError && attempts >= maxAttempts) {
        logger.log("Max retries reached. Returning last generated artifacts (potentially invalid).", "error");
    }

    logger.log("Artifacts generated.", "ai", {
        generatedRules: finalResult.prometheus_yaml,
        generatedDashboard: finalResult.grafana_json,
        generatedSlothSpec: finalResult.sloth_yaml
    });

    return {
        generatedRules: finalResult.prometheus_yaml,
        generatedDashboard: finalResult.grafana_json,
        generatedSlothSpec: finalResult.sloth_yaml,
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
