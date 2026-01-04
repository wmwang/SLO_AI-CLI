import React from 'react';
import { Box, Text } from 'ink';
import { SLO } from '../../agent/state.js';

interface ResultViewProps {
    mode: 'NEW' | 'OPTIMIZE';
    rulesPath: string;
    dashboardPath: string;
    report: string;
    selectedSLOs?: SLO[];
}

const getGraphMock = (type?: string) => {
    switch (type?.toLowerCase()) {
        case 'latency': return "  |   /\\   \n  |__/  \\__";
        case 'errors': return "  |       _\n  |___|___|";
        case 'traffic': return "  |  /  /  \n  | /  /   ";
        default: return "  | ~~~~~~ \n  |________";
    }
};

const ResultView: React.FC<ResultViewProps> = ({ mode, rulesPath, dashboardPath, report, selectedSLOs }) => {
    if (mode === 'NEW') {
        return (
            <Box flexDirection="column" borderStyle="double" borderColor="green" padding={1}>
                <Text bold color="green">SUCCESS! Artifacts Generated (成功生成文件)</Text>

                <Box marginTop={1} flexDirection="column">
                    <Box>
                        <Text>📂 Prometheus Rules: </Text>
                        <Text color="cyan" underline>{rulesPath}</Text>
                    </Box>
                    <Box>
                        <Text>📊 Grafana Dashboard: </Text>
                        <Text color="cyan" underline>{dashboardPath}</Text>
                    </Box>
                </Box>

                <Box marginTop={1} borderStyle="single" borderColor="yellow" flexDirection="column" paddingX={1}>
                    <Text bold color="yellow">🚀 Next Steps (下一步建議):</Text>

                    <Box marginTop={1}>
                        <Text bold>1. Apply Prometheus Rules:</Text>
                    </Box>
                    <Box marginLeft={2}>
                        <Text color="gray">If using Prometheus Operator (K8s):</Text>
                        <Text color="white">   kubectl apply -f {rulesPath}</Text>
                        <Text color="gray">Otherwise, copy the content to your prometheus.yml rule_files.</Text>
                    </Box>

                    <Box marginTop={1}>
                        <Text bold>2. Import Grafana Dashboard:</Text>
                    </Box>
                    <Box marginLeft={2}>
                        <Text>   1. Open Grafana UI</Text>
                        <Text>   2. Go to Dashboards - Import</Text>
                        <Text>   3. Upload <Text color="cyan">{dashboardPath}</Text> or paste the JSON content.</Text>
                    </Box>

                    <Box marginTop={1}>
                        <Text bold>3. Verify Data:</Text>
                    </Box>
                    <Box marginLeft={2}>
                        <Text>   Wait for a few minutes, then check if data appearing in the dashboard.</Text>
                    </Box>
                    <Box marginLeft={2}>
                        <Text>   Wait for a few minutes, then check if data appearing in the dashboard.</Text>
                    </Box>
                </Box>

                {selectedSLOs && selectedSLOs.length > 0 && (
                    <Box marginTop={1} flexDirection="column" borderStyle="single" borderColor="gray">
                        <Box marginTop={-1} marginLeft={1}>
                            <Text bold backgroundColor="blue" color="white"> Dashboard Preview </Text>
                        </Box>
                        <Box flexDirection="row" flexWrap="wrap" padding={1}>
                            {selectedSLOs.map(slo => (
                                <Box key={slo.id} borderStyle="single" borderColor="gray" margin={1} width={30} height={6} flexDirection="column">
                                    <Text bold>{slo.name}</Text>
                                    <Text color="green" >{getGraphMock(slo.golden_signal)}</Text>
                                    <Text color="gray">Target: {slo.target}%</Text>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                )}
            </Box>
        );
    } else {
        return (
            <Box flexDirection="column" borderStyle="double" borderColor="blue" padding={1}>
                <Text bold color="blue">Optimization Report (優化建議報告)</Text>
                <Box marginTop={1} borderStyle="single" padding={1}>
                    <Text>{report}</Text>
                </Box>
                <Box marginTop={1}>
                    <Text color="gray">Based on the analysis, consider updating your SLO targets or window settings in your config.</Text>
                </Box>
            </Box>
        );
    }
};

export default ResultView;
