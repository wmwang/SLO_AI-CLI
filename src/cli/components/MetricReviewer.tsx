import React, { useState } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';

interface MetricReviewerProps {
    discoveredMetrics: string[];
    recommendedMetrics: string[];
    onGoalSubmit: (goal: string) => void;
    onConfirm: () => void;
    showRecommendations: boolean;
}

const MetricReviewer: React.FC<MetricReviewerProps> = ({
    discoveredMetrics,
    recommendedMetrics,
    onGoalSubmit,
    onConfirm,
    showRecommendations
}) => {
    const [goal, setGoal] = useState('');
    const [confirmInput, setConfirmInput] = useState('');
    const [confirmed, setConfirmed] = useState(false);

    const handleGoalSubmit = (value: string) => {
        onGoalSubmit(value);
    };

    const handleConfirm = (value: string) => {
        if (value.toLowerCase() === 'ok' || value.toLowerCase() === 'yes' || value === '') {
            setConfirmed(true);
            onConfirm();
        }
    };

    if (!showRecommendations) {
        return (
            <Box flexDirection="column" padding={1}>
                <Text bold color="green">Discovered {discoveredMetrics.length} Metrics</Text>
                <Box marginTop={1} marginBottom={1} flexDirection="column" height={6} overflow="hidden">
                    {discoveredMetrics.slice(0, 10).map((metric, idx) => (
                        <Text key={idx} color="gray">• {metric}</Text>
                    ))}
                    {discoveredMetrics.length > 10 && (
                        <Text color="gray" dimColor>... and {discoveredMetrics.length - 10} more</Text>
                    )}
                </Box>

                <Box borderStyle="round" borderColor="cyan" paddingX={1}>
                    <Text color="cyan">What do you want to observe? </Text>
                    <TextInput
                        value={goal}
                        onChange={setGoal}
                        onSubmit={handleGoalSubmit}
                        placeholder="e.g., latency and error rate"
                    />
                </Box>
                <Box marginTop={1}>
                    <Text color="gray" dimColor>Describe your observability goal and press Enter</Text>
                </Box>
            </Box>
        );
    }

    return (
        <Box flexDirection="column" padding={1}>
            <Text bold color="green">AI Recommended Metrics</Text>
            <Box marginTop={1} marginBottom={1} flexDirection="column">
                {recommendedMetrics.map((metric, idx) => (
                    <Box key={idx} marginBottom={1}>
                        <Text color="cyan">✓ </Text>
                        <Text bold>{metric}</Text>
                    </Box>
                ))}
            </Box>

            {!confirmed && (
                <>
                    <Box borderStyle="round" borderColor="green" paddingX={1}>
                        <Text color="green">Confirm? (type 'ok' or 'yes') </Text>
                        <TextInput
                            value={confirmInput}
                            onChange={setConfirmInput}
                            onSubmit={handleConfirm}
                            placeholder="ok"
                        />
                    </Box>
                    <Box marginTop={1}>
                        <Text color="gray" dimColor>Press Enter to generate Grafana Dashboard</Text>
                    </Box>
                </>
            )}
        </Box>
    );
};

export default MetricReviewer;
