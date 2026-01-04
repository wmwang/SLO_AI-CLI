import express from 'express';
import cors from 'cors';
import { router } from './routes.js';
import * as dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Allow large manifest payloads

// Logging Middleware
app.use((req, res, next) => {
    console.log(`[API] ${req.method} ${req.path}`);
    next();
});

// Routes
app.use('/api', router);

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', version: '1.0.0' });
});

// Start Server
app.listen(PORT, () => {
    console.log(`\n🚀 SLO Agent Server running on http://localhost:${PORT}`);
    console.log(`   Health Check: http://localhost:${PORT}/health`);
});
