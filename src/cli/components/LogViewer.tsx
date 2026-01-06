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
            // Limit message length in history to avoid huge blocks
            const truncatedLog = {
                ...log,
                message: log.message.length > 200 ? log.message.substring(0, 200) + '... (truncated)' : log.message
            };
            setLogs((prev) => [...prev.slice(-4), truncatedLog]); // Keep last 5 logs mainly
        };

        const handleStream = (token: string) => {
            setStreamingContent((prev) => {
                const newContent = (prev || '') + token;
                // Only keep the tail of the stream to prevent UI explosion
                // Show last 150 chars roughly
                if (newContent.length > 150) {
                    return '...' + newContent.slice(-150);
                }
                return newContent;
            });
        };

        logger.on('log', handleLog);
        logger.on('stream', handleStream);

        return () => {
            logger.off('log', handleLog);
            logger.off('stream', handleStream);
        };
    }, []);

    return (
        <Box flexDirection="column" borderStyle="single" borderColor="gray" paddingX={1} marginTop={1} height={8}>
            <Text bold>Live Agent Logs (Tail):</Text>
            {logs.map((log, index) => (
                <Box key={index} height={1} overflow="hidden">
                    <Text color="gray">[{new Date(log.timestamp).toLocaleTimeString()}] </Text>
                    <Text color={log.type === 'ai' ? 'magenta' : log.type === 'error' ? 'red' : 'white'} wrap="truncate">
                        {log.type === 'ai' ? '🤖 ' : ''}{log.message}
                    </Text>
                </Box>
            ))}
            {/* Streaming Section */}
            {streamingContent && (
                <Box height={1} overflow="hidden">
                    <Text color="gray">[{new Date().toLocaleTimeString()}] </Text>
                    <Text color="magenta" wrap="truncate">🤖 {streamingContent}█</Text>
                </Box>
            )}

            {logs.length === 0 && !streamingContent && <Text color="gray">Waiting for activity...</Text>}
        </Box>
    );
};

export default LogViewer;
