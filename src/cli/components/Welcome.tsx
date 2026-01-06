import React, { useEffect, useState } from 'react';
import { Box, Text } from 'ink';
import SelectInput from 'ink-select-input';
import figlet from 'figlet';
import Gradient from 'ink-gradient';

interface WelcomeProps {
    onSelect: (mode: 'NEW' | 'OPTIMIZE' | 'QUICK') => void;
}

const Welcome: React.FC<WelcomeProps> = ({ onSelect }) => {
    const [logo, setLogo] = useState<string>('');

    useEffect(() => {
        // Generate ASCII Logo on mount
        // Font 'ANSI Shadow' provides a solid, 3D look
        figlet.text('AI SLO Agent', {
            font: 'ANSI Shadow',
            horizontalLayout: 'default',
            verticalLayout: 'default',
            width: 100,
            whitespaceBreak: true
        }, function (err, data) {
            if (err) {
                console.log('Something went wrong with logo generation...');
                console.dir(err);
                return;
            }
            setLogo(data || '');
        });
    }, []);

    const items = [
        { label: 'Generate New SLOs (Scan K8s Manifests)', value: 'NEW' },
        { label: 'Optimize Existing SLOs (Analyze Metrics)', value: 'OPTIMIZE' },
        { label: 'Quick Observability (Discover Prometheus Metrics)', value: 'QUICK' }
    ];

    const handleSelect = (item: any) => {
        onSelect(item.value);
    };

    return (
        <Box flexDirection="column">
            <Box marginBottom={1}>
                {/* Apply Gradient to the Logo */}
                <Gradient name="morning">
                    <Text>{logo}</Text>
                </Gradient>
            </Box>

            <Text bold>Welcome to the AI Agent. Please select a mode:</Text>
            <Box marginTop={1} borderStyle="single" padding={1} borderColor="gray">
                <SelectInput items={items} onSelect={handleSelect} />
            </Box>
        </Box>
    );
};

export default Welcome;
