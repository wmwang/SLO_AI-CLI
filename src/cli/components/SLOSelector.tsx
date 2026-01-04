import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { SLO } from '../../agent/state.js';
import TypewriterText from './TypewriterText.js';

interface SLOSelectorProps {
    items: SLO[];
    onSubmit: (selected: SLO[]) => void;
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

const SLOSelector: React.FC<SLOSelectorProps> = ({ items, onSubmit }) => {
    const [cursor, setCursor] = useState(0);
    // Initially select all suggestions
    const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set(items.map((_, i) => i)));

    useInput((input: string, key: any) => {
        if (key.upArrow) {
            setCursor(Math.max(0, cursor - 1));
        }
        if (key.downArrow) {
            setCursor(Math.min(items.length - 1, cursor + 1));
        }
        if (input === ' ') {
            const newSelected = new Set(selectedIndices);
            if (newSelected.has(cursor)) {
                newSelected.delete(cursor);
            } else {
                newSelected.add(cursor);
            }
            setSelectedIndices(newSelected);
        }
        if (key.return) {
            const result = items.filter((_, i) => selectedIndices.has(i));
            onSubmit(result);
        }
    });

    return (
        <Box flexDirection="column">
            <Text bold color="green">Select SLOs to Implement (Space to toggle, Enter to confirm):</Text>
            <Box flexDirection="column" marginTop={1} marginBottom={1}>
                {items.map((item, index) => {
                    const isSelected = selectedIndices.has(index);
                    const isFocus = cursor === index;
                    const prefix = isSelected ? '▣' : '□'; // Nicer checkboxes
                    const cursorChar = isFocus ? '❯' : ' ';

                    const signalColor = getSignalColor(item.golden_signal);

                    // Determine delay: Sum of all previous characters * speed + some buffer
                    const previousItems = items.slice(0, index);
                    // Speed is defined inside TypewriterText as 30ms (default)
                    const speed = 20;
                    let delay = 0;
                    if (index > 0) {
                        delay = previousItems.reduce((acc, prevItem) => {
                            const len = prevItem.description_zh?.length || 0;
                            return acc + (len * speed) + 500; // 500ms pause between items
                        }, 0);
                    }

                    return (
                        <Box key={item.id} flexDirection="column" marginBottom={1} borderStyle={isFocus ? "round" : undefined} borderColor={isFocus ? "cyan" : undefined} paddingX={1}>
                            <Box>
                                <Text color={isFocus ? 'cyan' : 'white'}>
                                    {cursorChar} {prefix}
                                </Text>
                                <Text bold> {item.name}</Text>
                                <Text color="gray"> (Target: {item.target}%)</Text>
                                {item.golden_signal && (
                                    <Box marginLeft={2}>
                                        <Text color="black" backgroundColor={signalColor}> {item.golden_signal.toUpperCase()} </Text>
                                    </Box>
                                )}
                            </Box>

                            {/* Chinese Description Block */}
                            <Box marginLeft={4} marginTop={0}>
                                <Text color="gray" italic>{item.description}</Text>
                            </Box>
                            {item.description_zh && (
                                <Box marginLeft={4} marginTop={0} borderStyle="single" borderColor="gray" paddingX={1}>
                                    <Text color="yellow">說明: </Text>
                                    <TypewriterText text={item.description_zh} color="yellow" delay={delay} speed={speed} />
                                </Box>
                            )}
                        </Box>
                    );
                })}
            </Box>
            <Text color="gray">Detected {items.length} recommendations.</Text>
        </Box>
    );
};

export default SLOSelector;
