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
    modelName: process.env.OPENAI_MODEL_NAME || "gpt-4o-mini",
    temperature: 0,
    configuration: {
        baseURL: process.env.OPENAI_API_BASE,
        apiKey: process.env.OPENAI_API_KEY,
    }
});

// Schema for SLO Recommendation
const SLOSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    target: z.number().nullable().describe("Availability Target % (e.g., 99.9). MUST be between 0 and 100."),
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

    // Use standard chain without OpenAI-specific structured output
    const chain = SLO_RECOMMENDER_PROMPT.pipe(model);

    // Log the complete API payload that will be sent to LLM
    const messages = await SLO_RECOMMENDER_PROMPT.formatMessages({
        k8s_manifests: state.k8sManifests
    });
    const apiPayload = {
        model: "gpt-4o-mini",  // Model name from line 14
        messages: messages.map(msg => ({
            role: msg._getType() === 'system' ? 'system' : 'user',
            content: msg.content
        })),
        temperature: 0
    };
    logger.log(`Complete API Payload`, "info", apiPayload);

    const response = await chain.invoke({
        k8s_manifests: state.k8sManifests,
    });

    // Manually parse JSON from response
    const content = response.content as string;
    let result;
    try {
        // Try to extract JSON from markdown code blocks if present
        const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/```\n?([\s\S]*?)\n?```/);
        const jsonString = jsonMatch ? jsonMatch[1] : content;
        result = JSON.parse(jsonString);

        // If result is an array, wrap it in the expected object structure
        if (Array.isArray(result)) {
            result = { slos: result };
        }

        // Normalize fields if LLM used different keys
        if (result.slos && Array.isArray(result.slos)) {
            result.slos = result.slos.map((slo: any) => {
                let targetVal = slo.target !== undefined ? slo.target : slo.target_percentage;
                // Handle string numbers or nulls
                if (typeof targetVal === 'string') {
                    targetVal = parseFloat(targetVal);
                }
                if (targetVal === null || targetVal === undefined || isNaN(targetVal)) {
                    targetVal = 99.9; // Safe default
                }

                return {
                    ...slo,
                    target: targetVal,
                    window: slo.window !== undefined ? slo.window : slo.time_window
                };
            });
        }

        // Validate with Zod schema
        const validated = RecommendationOutput.parse(result);
        result = validated;
    } catch (error: any) {
        logger.log(`Failed to parse LLM response as JSON: ${error.message}`, "error");
        logger.log(`Raw response: ${content}`, "error");
        throw new Error(`LLM did not return valid JSON: ${error.message}`);
    }

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

    // Use standard chain without OpenAI-specific structured output
    const chain = ARTIFACT_GENERATOR_PROMPT.pipe(model);

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

        if (lastError) {
            // Append error instruction to the input data so the LLM sees it
            promptInput.selected_slos += `\n\n[IMPORTANT] PREVIOUS GENERATION FAILED WITH SLOTH ERROR:\n${lastError}\n\nPLEASE FIX THE YAML TO RESOLVE THIS ERROR.\nHint 1: If the error is 'both error and total queries can't be the same', you MUST either change the 'error_query' to be different or switch to 'raw' SLI type.\nHint 2: If the error is 'template must contain the {{ .window }} variable', it means your PromQL missing the window parameter. For Gauge metrics (like memory/saturation), wraps the metric in 'max_over_time(...[{{ .window }}])' or 'avg_over_time(...[{{ .window }}])'.`;
        }

        const response = await chain.invoke(promptInput);

        // Manually parse JSON from response
        const content = response.content as string;
        let result;
        try {
            // Try to extract JSON from markdown code blocks if present
            const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/```\n?([\s\S]*?)\n?```/);
            const jsonString = jsonMatch ? jsonMatch[1] : content;
            result = JSON.parse(jsonString);

            // Validate with Zod schema
            const validated = ArtifactsOutput.parse(result);
            result = validated;
        } catch (error: any) {
            logger.log(`Failed to parse LLM response as JSON: ${error.message}`, "error");
            // If parsing fails, we treat it as an error to retry if possible, or just fail this attempt
            lastError = `JSON Parsing Error: ${error.message}`;
            continue; // Retry loop
        }

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

    // Log the complete API payload that will be sent to LLM
    const messages = await SLO_OPTIMIZER_PROMPT.formatMessages({
        metrics_data: state.metricsData || "No specific metrics provided, please perform general audit based on best practices.",
    });
    const apiPayload = {
        model: "gpt-4o-mini",  // Model name from line 14
        messages: messages.map(msg => ({
            role: msg._getType() === 'system' ? 'system' : 'user',
            content: msg.content
        })),
        temperature: 0,
        stream: true  // This endpoint uses streaming
    };
    logger.log(`Complete API Payload`, "info", apiPayload);

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
