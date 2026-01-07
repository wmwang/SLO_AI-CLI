import React, { useEffect, useState } from 'react';
import { Box, Text } from 'ink';
import { logger } from '../../utils/logger.js';

interface LogEntry {
    message: string;
    type: 'info' | 'ai' | 'error';
    timestamp: Date;
}

// Marquee component for scrolling text
const MarqueeText: React.FC<{ text: string; color: string; maxWidth: number }> = ({ text, color, maxWidth }) => {
    const [offset, setOffset] = useState(0);
    const shouldScroll = text.length > maxWidth;

    useEffect(() => {
        if (!shouldScroll) return;

        const interval = setInterval(() => {
            setOffset((prev) => {
                const next = prev + 1;
                // Reset when we've scrolled past the text
                return next > text.length ? 0 : next;
            });
        }, 200); // Scroll speed: 200ms per character

        return () => clearInterval(interval);
    }, [text, shouldScroll]);

    if (!shouldScroll) {
        return <Text color={color}>{text}</Text>;
    }

    // Create scrolling effect by cycling through the text
    const displayText = text.substring(offset, offset + maxWidth);
    const paddedText = displayText.length < maxWidth
        ? displayText + ' '.repeat(maxWidth - displayText.length)
        : displayText;

    return <Text color={color}>{paddedText}</Text>;
};

const LogViewer: React.FC = () => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [streamingContent, setStreamingContent] = useState<string | null>(null);
    const maxLogWidth = 100; // Approximate max width for log messages

    useEffect(() => {
        const handleLog = (log: LogEntry) => {
            setStreamingContent(null);
            setLogs((prev) => [...prev.slice(-4), log]); // Keep last 5 logs
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
        <Box flexDirection="column" borderStyle="single" borderColor="gray" paddingX={1} marginTop={1} height={8}>
            <Text bold>Live Agent Logs (Tail):</Text>
            {logs.map((log, index) => {
                const prefix = `[${new Date(log.timestamp).toLocaleTimeString()}] ${log.type === 'ai' ? '🤖 ' : ''}`;
                const fullMessage = prefix + log.message;
                const messageColor = log.type === 'ai' ? 'magenta' : log.type === 'error' ? 'red' : 'white';

                return (
                    <Box key={index} height={1} overflow="hidden">
                        <MarqueeText
                            text={fullMessage}
                            color={messageColor}
                            maxWidth={maxLogWidth}
                        />
                    </Box>
                );
            })}
            {/* Streaming Section */}
            {streamingContent && (
                <Box height={1} overflow="hidden">
                    <MarqueeText
                        text={`[${new Date().toLocaleTimeString()}] 🤖 ${streamingContent}█`}
                        color="magenta"
                        maxWidth={maxLogWidth}
                    />
                </Box>
            )}

            {logs.length === 0 && !streamingContent && <Text color="gray">Waiting for activity...</Text>}
        </Box>
    );
};

export default LogViewer;
