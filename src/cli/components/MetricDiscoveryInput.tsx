import React, { useState } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';

interface MetricDiscoveryInputProps {
    onSubmit: (appName: string, namespace: string) => void;
}

const MetricDiscoveryInput: React.FC<MetricDiscoveryInputProps> = ({ onSubmit }) => {
    const [appName, setAppName] = useState('');
    const [namespace, setNamespace] = useState('');
    const [currentField, setCurrentField] = useState<'app' | 'namespace'>('app');

    const handleAppSubmit = (value: string) => {
        setAppName(value);
        setCurrentField('namespace');
    };

    const handleNamespaceSubmit = (value: string) => {
        setNamespace(value);
        onSubmit(appName, value);
    };

    return (
        <Box flexDirection="column" padding={1}>
            <Text bold color="cyan">Quick Observability Setup</Text>
            <Text color="gray" dimColor>Discover metrics from your existing Prometheus deployment</Text>

            <Box marginTop={1} flexDirection="column">
                <Box marginBottom={1}>
                    <Text color={currentField === 'app' ? 'green' : 'white'}>
                        App Name: {appName || (currentField === 'app' ? '' : '(not set)')}
                    </Text>
                </Box>

                {currentField === 'app' && (
                    <Box>
                        <Text color="cyan">➤ </Text>
                        <TextInput
                            value={appName}
                            onChange={setAppName}
                            onSubmit={handleAppSubmit}
                            placeholder="e.g., my-service"
                        />
                    </Box>
                )}

                {currentField === 'namespace' && (
                    <>
                        <Box marginBottom={1}>
                            <Text color="green">Namespace: </Text>
                        </Box>
                        <Box>
                            <Text color="cyan">➤ </Text>
                            <TextInput
                                value={namespace}
                                onChange={setNamespace}
                                onSubmit={handleNamespaceSubmit}
                                placeholder="e.g., production"
                            />
                        </Box>
                    </>
                )}
            </Box>

            <Box marginTop={1}>
                <Text color="gray" dimColor>
                    {currentField === 'app' ? 'Press Enter to continue' : 'Press Enter to discover metrics'}
                </Text>
            </Box>
        </Box>
    );
};

export default MetricDiscoveryInput;
