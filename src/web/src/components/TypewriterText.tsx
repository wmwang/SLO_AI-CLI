import React, { useState, useEffect } from 'react';

interface TypewriterTextProps {
    text: string;
    speed?: number;
    delay?: number;
}

const TypewriterText: React.FC<TypewriterTextProps> = ({ text, speed = 20, delay = 0 }) => {
    const [displayedText, setDisplayedText] = useState('');

    useEffect(() => {
        let currentIndex = 0;
        let timeoutId: any;

        const startTyping = () => {
            const intervalId = setInterval(() => {
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
            
            return () => clearInterval(intervalId);
        };

        if (delay > 0) {
            timeoutId = setTimeout(startTyping, delay);
        } else {
            return startTyping();
        }

        return () => {
            clearTimeout(timeoutId);
        };
    }, [text, speed, delay]);

    return <span>{displayedText}</span>;
};

export default TypewriterText;
