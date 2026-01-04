import React, { useEffect, useState, useRef } from 'react';
import { Box, Text } from 'ink';
import { logger } from '../../utils/logger.js';

interface LogEntry {
    message: string;
    type: 'info' | 'ai' | 'error';
    timestamp: Date;
}

const LogViewer: React.FC = () => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [streamingContent, setStreamingContent] = useState<string | null>(null);

    useEffect(() => {
        const handleLog = (log: LogEntry) => {
            // If we were streaming, flush it to logs first
            setStreamingContent(null);
            setLogs((prev) => [...prev.slice(-4), log]); // Keep last 5 logs mainly
        };

        const handleStream = (token: string) => {
            setStreamingContent((prev) => (prev || '') + token);
        };

        logger.on('log', handleLog);
        logger.on('stream', handleStream);

        return () => {
            logger.off('log', handleLog);
            logger.off('stream', handleStream);
        };
    }, []);

    return (
        <Box flexDirection="column" borderStyle="single" borderColor="gray" paddingX={1} marginTop={1}>
            <Text bold>Live Agent Logs:</Text>
            {logs.map((log, index) => (
                <Box key={index}>
                    <Text color="gray">[{new Date(log.timestamp).toLocaleTimeString()}] </Text>
                    <Text color={log.type === 'ai' ? 'magenta' : log.type === 'error' ? 'red' : 'white'}>
                        {log.type === 'ai' ? '🤖 ' : ''}{log.message}
                    </Text>
                </Box>
            ))}
            {/* Streaming Section */}
            {streamingContent && (
                <Box>
                    <Text color="gray">[{new Date().toLocaleTimeString()}] </Text>
                    <Text color="magenta">🤖 {streamingContent}█</Text>
                </Box>
            )}

            {logs.length === 0 && !streamingContent && <Text color="gray">Waiting for activity...</Text>}
        </Box>
    );
};

export default LogViewer;
