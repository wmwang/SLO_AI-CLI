import React from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';

interface StatusProps {
    message: string;
    spinner?: string;
}

const Status: React.FC<StatusProps> = ({ message }) => {
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
