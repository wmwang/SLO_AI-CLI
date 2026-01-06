import { Router } from 'express';
import { recommendSLOsNode, generateArtifactsNode, optimizeSLOsNode } from '../agent/nodes.js';
import { stateManager } from '../agent/state_manager.js';
import { AgentState } from '../agent/state.js';

export const router = Router();

// Endpoint: Analyze Manifest (Recommend SLOs)
router.post('/analyze-manifest', async (req, res) => {
    try {
        const { k8sManifests } = req.body;
        if (!k8sManifests) {
            return res.status(400).json({ error: 'k8sManifests is required' });
        }

        // Mock State for the node
        const inputState = {
            k8sManifests,
            // default other values (not used by this node usually)
            recommendedSLOs: [],
            selectedSLOs: [],
            generatedRules: "",
            generatedDashboard: "",
            generatedSlothSpec: "",
            metricsData: "",
            prometheusUrl: "",
            optimizationReport: "",
            // Phase 16 fields
            appName: "",
            namespace: "",
            discoveredMetrics: [],
            userObservabilityGoal: "",
            recommendedMetrics: [],
            quickDashboard: ""
        };

        const result = await recommendSLOsNode(inputState);
        res.json(result);
    } catch (error: any) {
        console.error("Error in /analyze-manifest:", error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
});

// Endpoint: Generate Artifacts
router.post('/generate-artifacts', async (req, res) => {
    try {
        const { selectedSLOs } = req.body;
        if (!selectedSLOs || !Array.isArray(selectedSLOs)) {
            return res.status(400).json({ error: 'selectedSLOs array is required' });
        }

        const inputState = {
            selectedSLOs,
            // defaults
            k8sManifests: "",
            recommendedSLOs: [],
            generatedRules: "",
            generatedDashboard: "",
            generatedSlothSpec: "",
            metricsData: "",
            prometheusUrl: "",
            optimizationReport: "",
            // Phase 16 fields
            appName: "",
            namespace: "",
            discoveredMetrics: [],
            userObservabilityGoal: "",
            recommendedMetrics: [],
            quickDashboard: ""
        };

        const result = await generateArtifactsNode(inputState);

        // Save state (Memory)
        await stateManager.saveState(selectedSLOs, {
            rules: "generated via API",
            dashboard: "generated via API"
        });

        res.json(result);
    } catch (error: any) {
        console.error("Error in /generate-artifacts:", error);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint: Optimize SLOs
router.post('/optimize', async (req, res) => {
    try {
        const { metricsData, slos } = req.body; // slos can be passed from frontend if needed context
        /* 
           NOTE: In CLI, we loaded context from memory. 
           In Web, the frontend can pass it or we check memory here.
           Let's check input slos first, if missing check memory.
        */

        let loadedSLOs = slos || [];
        if (loadedSLOs.length === 0) {
            const hasMemory = await stateManager.exists();
            if (hasMemory) {
                const memory = await stateManager.loadState();
                if (memory) loadedSLOs = memory.slos;
            }
        }

        // Augment metrics data with context directly here or passing to node?
        // optimizeSLOsNode expects `metricsData` in state.
        // We might need to manually inject context string into metricsData like we did in CLI ui.tsx

        let contextData = `User Input Metrics:\n${metricsData || ''}\n\n`;
        if (loadedSLOs.length > 0) {
            contextData += `[System Memory] Configured SLOs (from previous run):\n${JSON.stringify(loadedSLOs, null, 2)}\n`;
        }

        const inputState = {
            metricsData: contextData,
            // defaults
            k8sManifests: "",
            recommendedSLOs: [],
            selectedSLOs: loadedSLOs,
            generatedRules: "",
            generatedDashboard: "",
            generatedSlothSpec: "",
            prometheusUrl: "",
            optimizationReport: "",
            // Phase 16 fields
            appName: "",
            namespace: "",
            discoveredMetrics: [],
            userObservabilityGoal: "",
            recommendedMetrics: [],
            quickDashboard: ""
        };

        // Note: verify if optimizeSLOsNode supports streaming response?
        // The node returns a string `optimizationReport`. 
        // If we want streaming in Web UI, we need Server-Sent Events (SSE) or WebSocket.
        // For MVC MVP, let's just await full response first. 
        // TODO: Upgrade to SSE for streaming later.

        const result = await optimizeSLOsNode(inputState);
        res.json(result);

    } catch (error: any) {
        console.error("Error in /optimize:", error);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint: Get State (Memory)
router.get('/state', async (req, res) => {
    try {
        const exists = await stateManager.exists();
        if (!exists) {
            return res.json({ exists: false, slos: [] });
        }
        const memory = await stateManager.loadState();
        res.json({ exists: true, ...memory });
    } catch (error: any) {
        console.error("Error in /state:", error);
        res.status(500).json({ error: error.message });
    }
});
