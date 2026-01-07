import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import Gradient from 'ink-gradient';

interface StatusProps {
    message: string;
    spinner?: string;
    isAI?: boolean; // Flag to enable AI-specific effects
}

const Status: React.FC<StatusProps> = ({ message, isAI = false }) => {
    const [dots, setDots] = useState('');
    const [pulseChar, setPulseChar] = useState('●');

    useEffect(() => {
        if (!isAI) return;

        // Typewriter dots animation
        const dotsInterval = setInterval(() => {
            setDots(prev => prev.length >= 3 ? '' : prev + '.');
        }, 500);

        // Pulse animation
        const pulseInterval = setInterval(() => {
            setPulseChar(prev => prev === '●' ? '○' : '●');
        }, 300);

        return () => {
            clearInterval(dotsInterval);
            clearInterval(pulseInterval);
        };
    }, [isAI]);

    if (isAI) {
        return (
            <Box flexDirection="column" borderStyle="round" borderColor="magenta" padding={1}>
                <Box>
                    <Gradient name="rainbow">
                        <Text bold>🤖 AI Agent is Thinking{dots}</Text>
                    </Gradient>
                </Box>
                <Box marginTop={1}>
                    <Text color="magenta">{pulseChar} </Text>
                    <Text color="cyan">{message}</Text>
                </Box>
                <Box marginTop={1}>
                    <Text color="gray" dimColor>⚡ Communicating with LLM in real-time...</Text>
                </Box>
            </Box>
        );
    }

    return (
        <Box>
            <Text color="green">
                <Spinner type="dots" />
            </Text>
            <Text> {message}</Text>
        </Box>
    );
};

export default Status;
