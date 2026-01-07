import React, { useState } from 'react';
import { Box, Text } from 'ink';
import Welcome from './components/Welcome.js';
import PathInput from './components/PathInput.js';
import SLOReviewer from './components/SLOReviewer.js';
import MetricInput from './components/MetricInput.js';
import Status from './components/Status.js';
import ResultView from './components/ResultView.js';
import LogViewer from './components/LogViewer.js';
import MetricDiscoveryInput from './components/MetricDiscoveryInput.js';
import MetricReviewer from './components/MetricReviewer.js';
import { SLO } from '../agent/state.js';
import { recommendationGraph, generationGraph, optimizationGraph, refinementGraph, discoveryGraph, metricRecommendationGraph, quickDashboardGraph } from '../agent/graph.js';
import fs from 'fs-extra';
import path from 'path';
import { stateManager } from '../agent/state_manager.js';

export type ViewState =
    | 'WELCOME'
    | 'INPUT_PATH'
    | 'ANALYZING'
    | 'SELECTING_SLOS'
    | 'GENERATING_ARTIFACTS'
    | 'INPUT_METRICS' // For Optimization Mode
    | 'OPTIMIZING'   // For Optimization Mode
    | 'INPUT_DISCOVERY' // For Quick Observability
    | 'DISCOVERING_METRICS' // For Quick Observability
    | 'REVIEWING_METRICS' // For Quick Observability
    | 'RECOMMENDING_METRICS' // For Quick Observability
    | 'GENERATING_DASHBOARD' // For Quick Observability
    | 'SHOW_RESULT'
    | 'ERROR';

const App = () => {
    const [view, setView] = useState<ViewState>('WELCOME');
    const [mode, setMode] = useState<'NEW' | 'OPTIMIZE' | 'QUICK'>('NEW');
    const [error, setError] = useState<string | null>(null);

    // Data State
    const [k8sManifests, setK8sManifests] = useState<string>("");
    const [recommendedSLOs, setRecommendedSLOs] = useState<SLO[]>([]);
    const [selectedSLOs, setSelectedSLOs] = useState<SLO[]>([]);
    const [metricsData, setMetricsData] = useState<string>("");
    const [isRefining, setIsRefining] = useState<boolean>(false);

    // Results
    const [generatedRules, setGeneratedRules] = useState<string>("");
    const [generatedDashboard, setGeneratedDashboard] = useState<string>("");
    const [optimizationReport, setOptimizationReport] = useState<string>("");
    const [hasLoadedMemory, setHasLoadedMemory] = useState<boolean>(false);

    // Quick Observability State
    const [appName, setAppName] = useState<string>("");
    const [namespace, setNamespace] = useState<string>("");
    const [discoveredMetrics, setDiscoveredMetrics] = useState<string[]>([]);
    const [recommendedMetrics, setRecommendedMetrics] = useState<string[]>([]);
    const [showMetricRecommendations, setShowMetricRecommendations] = useState<boolean>(false);
    const [quickDashboard, setQuickDashboard] = useState<string>("");

    const handleModeSelect = (selectedMode: 'NEW' | 'OPTIMIZE' | 'QUICK') => {
        setMode(selectedMode);
        if (selectedMode === 'NEW') {
            setView('INPUT_PATH');
        } else if (selectedMode === 'QUICK') {
            setView('INPUT_DISCOVERY');
        } else {
            // Check for memory
            checkMemoryAndSwitch();
        }
    };

    const checkMemoryAndSwitch = async () => {
        const hasMemory = await stateManager.exists();
        if (hasMemory) {
            const memory = await stateManager.loadState();
            if (memory && memory.slos.length > 0) {
                // Pre-load SLOs from memory for context
                setSelectedSLOs(memory.slos);
                setHasLoadedMemory(true);
                // We could show a message here, but for now just proceed to Input
            }
        }
        setView('INPUT_METRICS');
    };

    const handlePathSubmit = async (inputPath: string) => {
        try {
            setView('ANALYZING');
            // Read files
            // Simple logic: if dir, read all yaml/yml/json. If file, read file.
            const stats = await fs.stat(inputPath);
            let content = "";

            if (stats.isDirectory()) {
                const files = await fs.readdir(inputPath);
                for (const file of files) {
                    if (file.endsWith('.yaml') || file.endsWith('.yml') || file.endsWith('.json')) {
                        const fileContent = await fs.readFile(path.join(inputPath, file), 'utf-8');
                        content += `\n--- File: ${file} ---\n${fileContent}`;
                    }
                }
            } else {
                content = await fs.readFile(inputPath, 'utf-8');
            }

            setK8sManifests(content);

            // Run Recommendation Graph
            const result = await recommendationGraph.invoke({ k8sManifests: content });
            setRecommendedSLOs(result.recommendedSLOs || []);
            setView('SELECTING_SLOS');

        } catch (err: any) {
            setError(err.message);
            setView('ERROR');
        }
    };

    const handleSLOSelection = async (selected: SLO[]) => {
        setSelectedSLOs(selected);
        setView('GENERATING_ARTIFACTS');

        try {
            const result = await generationGraph.invoke({ selectedSLOs: selected });
            setGeneratedRules(result.generatedRules || "");
            setGeneratedDashboard(result.generatedDashboard || "");

            // Save to disk (optional, maybe ask user? For now just save to ./output)
            await fs.ensureDir('./output');
            await fs.writeFile('./output/prometheus_rules.yaml', result.generatedRules || "");
            await fs.writeFile('./output/dashboard.json', result.generatedDashboard || "");
            if (result.generatedSlothSpec) {
                await fs.writeFile('./output/sloth.yaml', result.generatedSlothSpec);
            }

            // Save State (Memory)
            await stateManager.saveState(selected, {
                rules: './output/prometheus_rules.yaml',
                dashboard: './output/dashboard.json'
            });

            setView('SHOW_RESULT');
        } catch (err: any) {
            setError(err.message);
            setView('ERROR');
        }
    };

    const handleMetricSubmit = async (data: string) => {
        setMetricsData(data);
        setView('OPTIMIZING');

        try {
            // Combine user metrics input with persisted Memory (SLO context)
            let context = `User Input Metrics:\n${data}\n\n`;

            // If we have selectedSLOs in state (loaded from memory), append them to context for LLM
            if (selectedSLOs.length > 0) {
                context += `[System Memory] Configured SLOs (from previous run):\n${JSON.stringify(selectedSLOs, null, 2)}\n`;
            }

            const result = await optimizationGraph.invoke({ metricsData: context });
            setOptimizationReport(result.optimizationReport || "No report generated.");
            setView('SHOW_RESULT');
        } catch (err: any) {
            setError(err.message);
            setView('ERROR');
        }
    }

    const handleRefinement = async (feedback: string) => {
        setIsRefining(true);
        try {
            const result = await refinementGraph.invoke({
                recommendedSLOs: recommendedSLOs,
                metricsData: feedback
            });

            if (result.recommendedSLOs) {
                setRecommendedSLOs(result.recommendedSLOs);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsRefining(false);
        }
    };

    // Quick Observability Handlers
    const handleDiscoverySubmit = async (app: string, ns: string) => {
        setAppName(app);
        setNamespace(ns);
        setView('DISCOVERING_METRICS');

        try {
            const result = await discoveryGraph.invoke({
                appName: app,
                namespace: ns
            });

            if (result.discoveredMetrics) {
                setDiscoveredMetrics(result.discoveredMetrics);
                setView('REVIEWING_METRICS');
            }
        } catch (err: any) {
            setError(err.message);
            setView('ERROR');
        }
    };

    const handleGoalSubmit = async (goal: string) => {
        setView('RECOMMENDING_METRICS');

        try {
            const result = await metricRecommendationGraph.invoke({
                discoveredMetrics: discoveredMetrics,
                userObservabilityGoal: goal
            });

            if (result.recommendedMetrics) {
                setRecommendedMetrics(result.recommendedMetrics);
                setShowMetricRecommendations(true);
                setView('REVIEWING_METRICS');
            }
        } catch (err: any) {
            setError(err.message);
            setView('ERROR');
        }
    };

    const handleDashboardGeneration = async () => {
        setView('GENERATING_DASHBOARD');

        try {
            const result = await quickDashboardGraph.invoke({
                appName: appName,
                namespace: namespace,
                recommendedMetrics: recommendedMetrics,
                metricsData: "" // Will be populated by node
            });

            if (result.quickDashboard) {
                setQuickDashboard(result.quickDashboard);

                // Save dashboard to file
                const outputDir = path.join(process.cwd(), 'output');
                await fs.ensureDir(outputDir);
                const dashboardPath = path.join(outputDir, 'quick_dashboard.json');
                await fs.writeFile(dashboardPath, result.quickDashboard);

                setView('SHOW_RESULT');
            }
        } catch (err: any) {
            setError(err.message);
            setView('ERROR');
        }
    };

    return (
        <Box flexDirection="column" padding={1}>
            {view !== 'WELCOME' && (
                <Box marginBottom={1}>
                    <Text bold color="cyan">Kubernetes SLO Agent</Text>
                </Box>
            )}

            {view === 'WELCOME' && <Welcome onSelect={handleModeSelect} />}
            {view === 'INPUT_PATH' && <PathInput onSubmit={handlePathSubmit} />}
            {view === 'INPUT_METRICS' && <MetricInput onSubmit={handleMetricSubmit} hasMemory={hasLoadedMemory} />}

            {view === 'ANALYZING' && <Status message="Analyzing K8s Manifests with AI..." isAI={true} />}
            {view === 'SELECTING_SLOS' && <SLOReviewer items={recommendedSLOs} onConfirm={handleSLOSelection} onRefine={handleRefinement} isRefining={isRefining} />}

            {view === 'GENERATING_ARTIFACTS' && <Status message="Generating Prometheus Rules & Grafana Dashboard..." isAI={true} />}
            {view === 'OPTIMIZING' && <Status message="Analyzing Metrics & Optimizing SLOs..." isAI={true} />}

            {/* Quick Observability Views */}
            {view === 'INPUT_DISCOVERY' && <MetricDiscoveryInput onSubmit={handleDiscoverySubmit} />}
            {view === 'DISCOVERING_METRICS' && <Status message="Discovering metrics from Prometheus..." spinner="dots" />}
            {view === 'REVIEWING_METRICS' && (
                <MetricReviewer
                    discoveredMetrics={discoveredMetrics}
                    recommendedMetrics={recommendedMetrics}
                    onGoalSubmit={handleGoalSubmit}
                    onConfirm={handleDashboardGeneration}
                    showRecommendations={showMetricRecommendations}
                />
            )}
            {view === 'RECOMMENDING_METRICS' && <Status message="AI is selecting relevant metrics..." isAI={true} />}
            {view === 'GENERATING_DASHBOARD' && <Status message="Generating Grafana Dashboard..." isAI={true} />}

            {view === 'SHOW_RESULT' && (
                <ResultView
                    mode={mode}
                    rulesPath="./output/prometheus_rules.yaml"
                    dashboardPath={mode === 'QUICK' ? './output/quick_dashboard.json' : './output/dashboard.json'}
                    report={optimizationReport}
                    selectedSLOs={selectedSLOs}
                />
            )}

            {view === 'ERROR' && (
                <Box borderStyle="single" borderColor="red">
                    <Text color="red">Error: {error}</Text>
                </Box>
            )}

            <LogViewer />
        </Box>
    );
};

export default App;
