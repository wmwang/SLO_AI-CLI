import React, { useState } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import { SLO } from '../../agent/state.js';
import TypewriterText from './TypewriterText.js';

interface SLOReviewerProps {
    items: SLO[];
    onConfirm: (selected: SLO[]) => void;
    onRefine: (feedback: string) => void;
    isRefining: boolean;
}

const getSignalColor = (signal?: string) => {
    switch (signal?.toLowerCase()) {
        case 'latency': return 'yellow';
        case 'errors': return 'red';
        case 'traffic': return 'blue';
        case 'saturation': return 'magenta';
        default: return 'white';
    }
};

const SLOReviewer: React.FC<SLOReviewerProps> = ({ items, onConfirm, onRefine, isRefining }) => {
    const [input, setInput] = useState('');

    const handleSubmit = (value: string) => {
        const trimmed = value.trim().toLowerCase();
        if (['', 'ok', 'yes', 'y', 'confirm'].includes(trimmed)) {
            onConfirm(items);
        } else {
            setInput(''); // Clear input for next
            onRefine(value);
        }
    };

    return (
        <Box flexDirection="column">
            <Text bold color="green">Review Proposed SLOs:</Text>
            <Box flexDirection="column" marginTop={1} marginBottom={1}>
                {items.length === 0 ? (
                    <Text color="red">No SLOs in the list. Type instructions to add some.</Text>
                ) : (
                    items.map((item, index) => {
                        const signalColor = getSignalColor(item.golden_signal);
                        return (
                            <Box key={index} flexDirection="column" marginBottom={1} borderStyle="single" borderColor="gray" paddingX={1}>
                                <Box>
                                    <Text bold color="white"> • {item.name}</Text>
                                    <Text color="gray"> (Target: {item.target}%)</Text>
                                    {item.golden_signal && (
                                        <Box marginLeft={2}>
                                            <Text color="black" backgroundColor={signalColor}> {item.golden_signal.toUpperCase()} </Text>
                                        </Box>
                                    )}
                                </Box>
                                <Box marginLeft={2}>
                                    <Text color="gray" dimColor>{item.description}</Text>
                                </Box>
                            </Box>
                        );
                    })
                )}
            </Box>

            <Box borderStyle="round" borderColor={isRefining ? "yellow" : "cyan"} paddingX={1}>
                <Box marginRight={1}>
                    <Text color={isRefining ? "yellow" : "cyan"}>
                        {isRefining ? "AI is Thinking..." : "Feedback >"}
                    </Text>
                </Box>
                {!isRefining && (
                    <TextInput
                        value={input}
                        onChange={setInput}
                        onSubmit={handleSubmit}
                        placeholder="Type 'ok' to confirm, or describe changes (e.g. 'remove traffic')..."
                    />
                )}
            </Box>
        </Box>
    );
};

export default SLOReviewer;
