import { StateGraph, START, END } from "@langchain/langgraph";
import { AgentState } from "./state.js";
import { recommendSLOsNode, generateArtifactsNode, optimizeSLOsNode } from "./nodes.js";

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
