import React, { useState } from 'react';
import { Box, Text } from 'ink';
import Welcome from './components/Welcome.js';
import PathInput from './components/PathInput.js';
import SLOSelector from './components/SLOSelector.js';
import MetricInput from './components/MetricInput.js';
import Status from './components/Status.js';
import ResultView from './components/ResultView.js';
import LogViewer from './components/LogViewer.js';
import { SLO } from '../agent/state.js';
import { recommendationGraph, generationGraph, optimizationGraph } from '../agent/graph.js';
import fs from 'fs-extra';
import path from 'path';

export type ViewState =
    | 'WELCOME'
    | 'INPUT_PATH'
    | 'ANALYZING'
    | 'SELECTING_SLOS'
    | 'GENERATING_ARTIFACTS'
    | 'INPUT_METRICS' // For Optimization Mode
    | 'OPTIMIZING'   // For Optimization Mode
    | 'SHOW_RESULT'
    | 'ERROR';

const App = () => {
    const [view, setView] = useState<ViewState>('WELCOME');
    const [mode, setMode] = useState<'NEW' | 'OPTIMIZE'>('NEW');
    const [error, setError] = useState<string | null>(null);

    // Data State
    const [k8sManifests, setK8sManifests] = useState<string>("");
    const [recommendedSLOs, setRecommendedSLOs] = useState<SLO[]>([]);
    const [selectedSLOs, setSelectedSLOs] = useState<SLO[]>([]);
    const [metricsData, setMetricsData] = useState<string>("");

    // Results
    const [generatedRules, setGeneratedRules] = useState<string>("");
    const [generatedDashboard, setGeneratedDashboard] = useState<string>("");
    const [optimizationReport, setOptimizationReport] = useState<string>("");

    const handleModeSelect = (selectedMode: 'NEW' | 'OPTIMIZE') => {
        setMode(selectedMode);
        if (selectedMode === 'NEW') {
            setView('INPUT_PATH');
        } else {
            setView('INPUT_METRICS');
        }
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
            const result = await optimizationGraph.invoke({ metricsData: data });
            setOptimizationReport(result.optimizationReport || "No report generated.");
            setView('SHOW_RESULT');
        } catch (err: any) {
            setError(err.message);
            setView('ERROR');
        }
    }

    return (
        <Box flexDirection="column" padding={1}>
            <Box marginBottom={1}>
                <Text bold color="cyan">Kubernetes SLO Agent</Text>
            </Box>

            {view === 'WELCOME' && <Welcome onSelect={handleModeSelect} />}
            {view === 'INPUT_PATH' && <PathInput onSubmit={handlePathSubmit} />}
            {view === 'INPUT_METRICS' && <MetricInput onSubmit={handleMetricSubmit} />}

            {view === 'ANALYZING' && <Status message="Analyzing K8s Manifests with AI..." spinner="dots" />}
            {view === 'SELECTING_SLOS' && <SLOSelector items={recommendedSLOs} onSubmit={handleSLOSelection} />}

            {view === 'GENERATING_ARTIFACTS' && <Status message="Generating Prometheus Rules & Grafana Dashboard..." spinner="dots" />}
            {view === 'OPTIMIZING' && <Status message="Analyzing Metrics & Optimizing SLOs..." spinner="dots" />}

            {view === 'SHOW_RESULT' && (
                <ResultView
                    mode={mode}
                    rulesPath="./output/prometheus_rules.yaml"
                    dashboardPath="./output/dashboard.json"
                    report={optimizationReport}
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
