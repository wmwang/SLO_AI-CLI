import React, { useState } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';

interface MetricInputProps {
    onSubmit: (data: string) => void;
    hasMemory?: boolean;
}

const MetricInput: React.FC<MetricInputProps> = ({ onSubmit, hasMemory }) => {
    const [data, setData] = useState('');

    return (
        <Box flexDirection="column">
            <Box>
                <Text>Enter your Metrics Data / Prometheus Context or URL:</Text>
                {hasMemory && (
                    <Box marginLeft={2}>
                        <Text color="black" backgroundColor="green"> MEMORY LOADED </Text>
                        <Text color="green"> (Context from prev. run autodetected) </Text>
                    </Box>
                )}
            </Box>
            <Text color="gray">(Press Enter to submit)</Text>
            <Box borderStyle="round" borderColor="yellow" padding={1}>
                <TextInput value={data} onChange={setData} onSubmit={onSubmit} placeholder='Paste your metrics summary here...' />
            </Box>
        </Box>
    );
};

export default MetricInput;
