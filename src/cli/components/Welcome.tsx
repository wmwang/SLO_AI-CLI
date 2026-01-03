import React from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';

interface WelcomeProps {
    onSelect: (mode: 'NEW' | 'OPTIMIZE') => void;
}

const Welcome: React.FC<WelcomeProps> = ({ onSelect }) => {
    const items = [
        { label: 'Generate New SLOs (Scan K8s Manifests)', value: 'NEW' },
        { label: 'Optimize Existing SLOs (Analyze Metrics)', value: 'OPTIMIZE' }
    ];

    const handleSelect = (item: any) => {
        onSelect(item.value);
    };

    return (
        <Box flexDirection="column">
            <Text>Welcome to the AI Agent. Please select a mode:</Text>
            <Box marginTop={1}>
                <SelectInput items={items} onSelect={handleSelect} />
            </Box>
        </Box>
    );
};

export default Welcome;
