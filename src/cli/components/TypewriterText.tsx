import React, { useState, useEffect } from 'react';
import { Text } from 'ink';

interface TypewriterTextProps {
    text: string;
    speed?: number; // ms per char
    color?: string;
    delay?: number;
}

const TypewriterText: React.FC<TypewriterTextProps> = ({ text, speed = 30, color, delay = 0 }) => {
    const [displayedText, setDisplayedText] = useState('');

    useEffect(() => {
        let currentIndex = 0;
        let timeoutId: NodeJS.Timeout;
        let intervalId: NodeJS.Timeout;

        const startTyping = () => {
            intervalId = setInterval(() => {
                setDisplayedText((prev) => {
                    if (currentIndex < text.length) {
                        currentIndex++;
                        return text.slice(0, currentIndex);
                    } else {
                        clearInterval(intervalId);
                        return prev;
                    }
                });
            }, speed);
        };

        if (delay > 0) {
            timeoutId = setTimeout(startTyping, delay);
        } else {
            startTyping();
        }

        return () => {
            clearTimeout(timeoutId);
            clearInterval(intervalId);
        };
    }, [text, speed, delay]);

    return <Text color={color}>{displayedText}</Text>;
};

export default TypewriterText;
