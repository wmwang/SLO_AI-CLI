#!/usr/bin/env node
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
    refineSLOsNode
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

        // Error handling
        this.server.onerror = (error) => console.error("[MCP Error]", error);
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

                    default:
                        throw new McpError(
                            ErrorCode.MethodNotFound,
                            `Unknown tool: ${request.params.name}`
                        );
                }
            } catch (error: any) {
                console.error("Error executing tool:", error);
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
        console.error("SLO Agent MCP Server running on stdio");
    }
}

const server = new SLOAgentServer();
server.run().catch(console.error);
