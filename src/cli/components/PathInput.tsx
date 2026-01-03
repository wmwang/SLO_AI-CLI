import React, { useState } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';

interface PathInputProps {
    onSubmit: (path: string) => void;
}

const PathInput: React.FC<PathInputProps> = ({ onSubmit }) => {
    const [path, setPath] = useState('');

    return (
        <Box flexDirection="column">
            <Text>Enter the path to your Kubernetes manifests (folder or file):</Text>
            <Box borderStyle="round" borderColor="green" padding={1}>
                <TextInput value={path} onChange={setPath} onSubmit={onSubmit} placeholder='/path/to/k8s' />
            </Box>
        </Box>
    );
};

export default PathInput;
