import { StateGraph, START, END } from "@langchain/langgraph";
import { AgentState } from "./state.js";
import { recommendSLOsNode, generateArtifactsNode, optimizeSLOsNode, refineSLOsNode } from "./nodes.js";

// Sub-graph for "New SLO" flow
const workflow = new StateGraph(AgentState)
    .addNode("recommendSLOs", recommendSLOsNode)
    // Edges? 
    // We need to define the flow. 
    // Note: The User Selection happens "outside" the graph or as an interrupt. 
    // For CLI simplicity, we might run the graph in stages.
    // Stage 1: Start -> recommendSLOs -> END
    // (CLI gets output, User selects)
    // Stage 2: (With selectedSLos) -> generateArtifacts -> END
    .addEdge(START, "recommendSLOs")
    .addEdge("recommendSLOs", END);

export const recommendationGraph = workflow.compile();

const generationWorkflow = new StateGraph(AgentState)
    .addNode("generateArtifacts", generateArtifactsNode)
    .addEdge(START, "generateArtifacts")
    .addEdge("generateArtifacts", END);

export const generationGraph = generationWorkflow.compile();


// Sub-graph for "Optimization" flow
const optimizationWorkflow = new StateGraph(AgentState)
    .addNode("optimizeSLOs", optimizeSLOsNode)
    .addEdge(START, "optimizeSLOs")
    .addEdge("optimizeSLOs", END);

export const optimizationGraph = optimizationWorkflow.compile();

// Sub-graph for "Refinement" flow (Conversational Loop)
const refinementWorkflow = new StateGraph(AgentState)
    .addNode("refineSLOs", refineSLOsNode)
    .addEdge(START, "refineSLOs")
    .addEdge("refineSLOs", END);

export const refinementGraph = refinementWorkflow.compile();

// Sub-graph for "Quick Observability" flow (Phase 16)
import { discoverMetricsNode, recommendMetricsNode, generateQuickDashboardNode } from "./nodes.js";

const discoveryWorkflow = new StateGraph(AgentState)
    .addNode("discoverMetrics", discoverMetricsNode)
    .addEdge(START, "discoverMetrics")
    .addEdge("discoverMetrics", END);

export const discoveryGraph = discoveryWorkflow.compile();

const metricRecommendationWorkflow = new StateGraph(AgentState)
    .addNode("recommendMetrics", recommendMetricsNode)
    .addEdge(START, "recommendMetrics")
    .addEdge("recommendMetrics", END);

export const metricRecommendationGraph = metricRecommendationWorkflow.compile();

const quickDashboardWorkflow = new StateGraph(AgentState)
    .addNode("generateQuickDashboard", generateQuickDashboardNode)
    .addEdge(START, "generateQuickDashboard")
    .addEdge("generateQuickDashboard", END);

export const quickDashboardGraph = quickDashboardWorkflow.compile();
