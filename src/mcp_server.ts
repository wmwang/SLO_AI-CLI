#!/usr/bin/env node

// CRITICAL: For MCP Server, we must avoid ANY output to stdout/stderr
// This includes dotenv's logging. We manually load .env to ensure complete silence.
import * as fs from 'fs';
import * as path from 'path';

// Manually load .env file without any logging
try {
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf-8');
        envContent.split('\n').forEach(line => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
                const equalIndex = trimmed.indexOf('=');
                if (equalIndex > 0) {
                    const key = trimmed.substring(0, equalIndex).trim();
                    const value = trimmed.substring(equalIndex + 1).trim();
                    if (key && !process.env[key]) {
                        process.env[key] = value;
                    }
                }
            }
        });
    }
} catch (error) {
    // Silently fail - MCP will handle missing env vars
}

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    ListToolsRequestSchema,
    CallToolRequestSchema,
    ErrorCode,
    McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import {
    recommendSLOsNode,
    generateArtifactsNode,
    optimizeSLOsNode,
    refineSLOsNode,
    discoverMetricsNode,
    recommendMetricsNode,
    generateQuickDashboardNode
} from "./agent/nodes.js";
import { SLO } from "./agent/state.js";

class SLOAgentServer {
    private server: Server;

    constructor() {
        this.server = new Server(
            {
                name: "slo-ai-agent",
                version: "1.0.0",
            },
            {
                capabilities: {
                    tools: {},
                },
            }
        );

        this.setupToolHandlers();

        // Error handling - silently handle errors for MCP
        // Errors will be reported through the MCP protocol
        this.server.onerror = (error) => {
            // Do NOT log to stderr - it will corrupt MCP stdio
        };
        process.on('SIGINT', async () => {
            await this.server.close();
            process.exit(0);
        });
    }

    private setupToolHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            return {
                tools: [
                    {
                        name: "recommend_slos",
                        description: "Analyze Kubernetes manifests and recommend Service Level Objectives (SLOs).",
                        inputSchema: {
                            type: "object",
                            properties: {
                                manifests: {
                                    type: "string",
                                    description: "The content of Kubernetes YAML manifests (Deployment, Service, etc.)",
                                },
                            },
                            required: ["manifests"],
                        },
                    },
                    {
                        name: "generate_artifacts",
                        description: "Generate Prometheus Rules, Grafana Dashboard, and Sloth Spec from a list of SLOs.",
                        inputSchema: {
                            type: "object",
                            properties: {
                                slos: {
                                    type: "string", // Passing as stringified JSON to ensure structure
                                    description: "JSON string representing an array of SLO objects.",
                                },
                            },
                            required: ["slos"],
                        },
                    },
                    {
                        name: "refine_slos",
                        description: "Refine a list of SLOs based on natural language feedback (e.g. 'remove traffic SLOs').",
                        inputSchema: {
                            type: "object",
                            properties: {
                                current_slos: {
                                    type: "string",
                                    description: "JSON string of total current SLOs.",
                                },
                                feedback: {
                                    type: "string",
                                    description: "Natural language instructions for modification.",
                                },
                            },
                            required: ["current_slos", "feedback"],
                        },
                    },
                    {
                        name: "optimize_slos",
                        description: "Analyze metrics data and provide optimization recommendations (e.g. error budget tuning).",
                        inputSchema: {
                            type: "object",
                            properties: {
                                metrics_data: {
                                    type: "string",
                                    description: "Raw metrics data or text description of current performance/burn-rate.",
                                },
                                current_slos: {
                                    type: "string",
                                    description: "Optional JSON string of current SLO configuration for context.",
                                }
                            },
                            required: ["metrics_data"],
                        },
                    },
                    {
                        name: "discover_prometheus_metrics",
                        description: "Discover existing Prometheus metrics for an application. Supports both real Prometheus and mock mode.",
                        inputSchema: {
                            type: "object",
                            properties: {
                                app_name: {
                                    type: "string",
                                    description: "Application name to discover metrics for.",
                                },
                                namespace: {
                                    type: "string",
                                    description: "Kubernetes namespace.",
                                },
                                prometheus_url: {
                                    type: "string",
                                    description: "Optional Prometheus URL. If not provided, uses mock data.",
                                }
                            },
                            required: ["app_name", "namespace"],
                        },
                    },
                    {
                        name: "recommend_key_metrics",
                        description: "Recommend 3-4 key metrics based on user's observability goals from discovered metrics.",
                        inputSchema: {
                            type: "object",
                            properties: {
                                discovered_metrics: {
                                    type: "string",
                                    description: "JSON array of discovered metric names.",
                                },
                                observability_goal: {
                                    type: "string",
                                    description: "User's observability goal in natural language (e.g., 'latency and errors', 'resource usage').",
                                }
                            },
                            required: ["discovered_metrics", "observability_goal"],
                        },
                    },
                    {
                        name: "generate_quick_dashboard",
                        description: "Generate a Grafana Dashboard JSON from recommended metrics for quick observability.",
                        inputSchema: {
                            type: "object",
                            properties: {
                                recommended_metrics: {
                                    type: "string",
                                    description: "JSON string of recommended metrics with their details.",
                                },
                                app_name: {
                                    type: "string",
                                    description: "Application name for dashboard title.",
                                },
                                namespace: {
                                    type: "string",
                                    description: "Kubernetes namespace.",
                                }
                            },
                            required: ["recommended_metrics", "app_name", "namespace"],
                        },
                    },
                ],
            };
        });

        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            try {
                switch (request.params.name) {
                    case "recommend_slos": {
                        const manifests = String(request.params.arguments?.manifests);
                        // Mock state
                        const mockState: any = { k8sManifests: manifests };
                        const result = await recommendSLOsNode(mockState);
                        return {
                            content: [
                                {
                                    type: "text",
                                    text: JSON.stringify(result.recommendedSLOs, null, 2),
                                },
                            ],
                        };
                    }

                    case "generate_artifacts": {
                        const slosJson = String(request.params.arguments?.slos);
                        let slos: SLO[] = [];
                        try {
                            slos = JSON.parse(slosJson);
                        } catch (e) {
                            throw new McpError(ErrorCode.InvalidParams, "Invalid JSON for 'slos'");
                        }

                        const mockState: any = { selectedSLOs: slos };
                        const result = await generateArtifactsNode(mockState);

                        return {
                            content: [
                                {
                                    type: "text",
                                    text: JSON.stringify({
                                        prometheus_rules: result.generatedRules,
                                        grafana_dashboard: result.generatedDashboard,
                                        sloth_spec: result.generatedSlothSpec
                                    }, null, 2),
                                },
                            ],
                        };
                    }

                    case "refine_slos": {
                        const currentSlosJson = String(request.params.arguments?.current_slos);
                        const feedback = String(request.params.arguments?.feedback);
                        let currentSlos: SLO[] = [];
                        try {
                            currentSlos = JSON.parse(currentSlosJson);
                        } catch (e) {
                            throw new McpError(ErrorCode.InvalidParams, "Invalid JSON for 'current_slos'");
                        }

                        // reuse logic: refineSLOsNode uses recommendedSLOs/selectedSLOs from state
                        const mockState: any = {
                            recommendedSLOs: currentSlos,
                            metricsData: feedback // Passing feedback via metricsData as per node implementation
                        };

                        const result = await refineSLOsNode(mockState);

                        return {
                            content: [
                                {
                                    type: "text",
                                    text: JSON.stringify(result.recommendedSLOs, null, 2)
                                }
                            ]
                        };
                    }

                    case "optimize_slos": {
                        const metrics = String(request.params.arguments?.metrics_data);
                        const slosJson = request.params.arguments?.current_slos ? String(request.params.arguments.current_slos) : "[]";

                        let currentSlos: SLO[] = [];
                        try {
                            currentSlos = JSON.parse(slosJson);
                        } catch (e) {
                            // ignore, just empty
                        }

                        const mockState: any = {
                            metricsData: metrics,
                            selectedSLOs: currentSlos
                        };

                        const result = await optimizeSLOsNode(mockState);
                        return {
                            content: [
                                {
                                    type: "text",
                                    text: result.optimizationReport || "No report generated."
                                }
                            ]
                        };
                    }

                    case "discover_prometheus_metrics": {
                        const appName = String(request.params.arguments?.app_name);
                        const namespace = String(request.params.arguments?.namespace);

                        const mockState: any = {
                            appName,
                            namespace,
                            discoveredMetrics: []
                        };

                        const result = await discoverMetricsNode(mockState);

                        return {
                            content: [
                                {
                                    type: "text",
                                    text: JSON.stringify({
                                        discoveredMetrics: result.discoveredMetrics
                                    }, null, 2),
                                },
                            ],
                        };
                    }

                    case "recommend_key_metrics": {
                        const discoveredMetricsJson = String(request.params.arguments?.discovered_metrics);
                        const observabilityGoal = String(request.params.arguments?.observability_goal);

                        let discoveredMetrics: string[] = [];
                        try {
                            discoveredMetrics = JSON.parse(discoveredMetricsJson);
                        } catch (e) {
                            throw new McpError(ErrorCode.InvalidParams, "Invalid JSON for 'discovered_metrics'");
                        }

                        const mockState: any = {
                            discoveredMetrics,
                            userObservabilityGoal: observabilityGoal,
                            recommendedMetrics: []
                        };

                        const result = await recommendMetricsNode(mockState);

                        return {
                            content: [
                                {
                                    type: "text",
                                    text: JSON.stringify({
                                        recommendedMetrics: result.recommendedMetrics
                                    }, null, 2),
                                },
                            ],
                        };
                    }

                    case "generate_quick_dashboard": {
                        const recommendedMetricsJson = String(request.params.arguments?.recommended_metrics);
                        const appName = String(request.params.arguments?.app_name);
                        const namespace = String(request.params.arguments?.namespace);

                        let recommendedMetrics: any[] = [];
                        try {
                            recommendedMetrics = JSON.parse(recommendedMetricsJson);
                        } catch (e) {
                            throw new McpError(ErrorCode.InvalidParams, "Invalid JSON for 'recommended_metrics'");
                        }

                        const mockState: any = {
                            appName,
                            namespace,
                            recommendedMetrics,
                            quickDashboard: null
                        };

                        const result = await generateQuickDashboardNode(mockState);

                        return {
                            content: [
                                {
                                    type: "text",
                                    text: JSON.stringify({
                                        dashboard: result.quickDashboard
                                    }, null, 2),
                                },
                            ],
                        };
                    }

                    default:
                        throw new McpError(
                            ErrorCode.MethodNotFound,
                            `Unknown tool: ${request.params.name}`
                        );
                }
            } catch (error: any) {
                // Return error through MCP protocol, do NOT log to stderr
                return {
                    content: [
                        {
                            type: "text",
                            text: `Error: ${error.message}`,
                        },
                    ],
                    isError: true,
                };
            }
        });
    }

    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);

        // CRITICAL: Do NOT output anything to stdout/stderr
        // MCP uses stdio for JSON-RPC communication
        // Any output will corrupt the protocol and cause -32000 errors
    }
}

async function main() {
    const server = new SLOAgentServer();
    await server.run();
}

main().catch((error) => {
    // Even errors must not be logged to stderr in MCP mode
    // The error will be handled by the MCP protocol
    process.exit(1);
});
