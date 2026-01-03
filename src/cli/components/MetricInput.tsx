import React, { useState } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';

interface MetricInputProps {
    onSubmit: (data: string) => void;
}

const MetricInput: React.FC<MetricInputProps> = ({ onSubmit }) => {
    const [data, setData] = useState('');

    return (
        <Box flexDirection="column">
            <Text>Enter your Metrics Data / Prometheus Context or URL:</Text>
            <Text color="gray">(Press Enter to submit)</Text>
            <Box borderStyle="round" borderColor="yellow" padding={1}>
                <TextInput value={data} onChange={setData} onSubmit={onSubmit} placeholder='Paste your metrics summary here...' />
            </Box>
        </Box>
    );
};

export default MetricInput;
