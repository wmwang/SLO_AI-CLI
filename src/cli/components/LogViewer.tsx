import React, { useEffect, useState } from 'react';
import { Box, Text } from 'ink';
import { logger } from '../../utils/logger.js';

interface LogEntry {
    message: string;
    type: 'info' | 'ai' | 'error';
    timestamp: Date;
}

const LogViewer: React.FC = () => {
    const [logs, setLogs] = useState<LogEntry[]>([]);

    useEffect(() => {
        const handleLog = (log: LogEntry) => {
            setLogs((prev) => [...prev.slice(-4), log]); // Keep last 5 logs to save space
        };

        logger.on('log', handleLog);
        return () => {
            logger.off('log', handleLog);
        };
    }, []);

    return (
        <Box flexDirection="column" borderStyle="single" borderColor="gray" paddingX={1} marginTop={1}>
            <Text bold>Live Agent Logs:</Text>
            {logs.map((log, index) => (
                <Box key={index}>
                    <Text color="gray">[{log.timestamp.toLocaleTimeString()}] </Text>
                    <Text color={log.type === 'ai' ? 'magenta' : log.type === 'error' ? 'red' : 'white'}>
                        {log.type === 'ai' ? '🤖 ' : ''}{log.message}
                    </Text>
                </Box>
            ))}
            {logs.length === 0 && <Text color="gray">Waiting for activity...</Text>}
        </Box>
    );
};

export default LogViewer;
