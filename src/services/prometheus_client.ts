import * as dotenv from "dotenv";
import { logger } from "../utils/logger.js";

dotenv.config();

export interface PrometheusMetric {
    name: string;
    type: string; // counter, gauge, histogram, summary
    help?: string;
}

/**
 * Mock metric data for testing when Prometheus server is unavailable
 */
const MOCK_METRICS: PrometheusMetric[] = [
    { name: "http_requests_total", type: "counter", help: "Total HTTP requests" },
    { name: "http_request_duration_seconds", type: "histogram", help: "HTTP request latency in seconds" },
    { name: "http_request_size_bytes", type: "histogram", help: "HTTP request size in bytes" },
    { name: "http_response_size_bytes", type: "histogram", help: "HTTP response size in bytes" },
    { name: "process_cpu_seconds_total", type: "counter", help: "Total CPU time consumed" },
    { name: "process_resident_memory_bytes", type: "gauge", help: "Resident memory size in bytes" },
    { name: "process_open_fds", type: "gauge", help: "Number of open file descriptors" },
    { name: "go_goroutines", type: "gauge", help: "Number of goroutines" },
    { name: "go_memstats_alloc_bytes", type: "gauge", help: "Number of bytes allocated" },
    { name: "grpc_server_handled_total", type: "counter", help: "Total gRPC requests handled" },
    { name: "grpc_server_handling_seconds", type: "histogram", help: "gRPC request latency" },
    { name: "database_queries_total", type: "counter", help: "Total database queries" },
    { name: "database_query_duration_seconds", type: "histogram", help: "Database query duration" },
    { name: "cache_hits_total", type: "counter", help: "Total cache hits" },
    { name: "cache_misses_total", type: "counter", help: "Total cache misses" },
    { name: "queue_depth", type: "gauge", help: "Current queue depth" },
    { name: "active_connections", type: "gauge", help: "Number of active connections" },
    { name: "error_total", type: "counter", help: "Total errors" },
];

export class PrometheusClient {
    private prometheusUrl: string | undefined;
    private apiKey: string | undefined;
    private customHeaders: Record<string, string> = {};

    constructor() {
        this.prometheusUrl = process.env.PROMETHEUS_URL;
        this.apiKey = process.env.PROMETHEUS_API_KEY;

        // Parse custom headers from environment variable
        // Format: PROMETHEUS_HEADERS=Header1:Value1,Header2:Value2
        if (process.env.PROMETHEUS_HEADERS) {
            try {
                const headerPairs = process.env.PROMETHEUS_HEADERS.split(',');
                headerPairs.forEach(pair => {
                    const [key, value] = pair.split(':').map(s => s.trim());
                    if (key && value) {
                        this.customHeaders[key] = value;
                    }
                });
            } catch (error) {
                console.error('[PrometheusClient] Failed to parse PROMETHEUS_HEADERS:', error);
            }
        }
    }

    /**
     * Build headers for Prometheus API requests
     */
    private buildHeaders(): HeadersInit {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        // Add API Key if configured (common patterns)
        if (this.apiKey) {
            // Support multiple auth patterns
            if (this.apiKey.startsWith('Bearer ')) {
                headers['Authorization'] = this.apiKey;
            } else if (this.apiKey.startsWith('Basic ')) {
                headers['Authorization'] = this.apiKey;
            } else {
                // Default to Bearer token
                headers['Authorization'] = `Bearer ${this.apiKey}`;
            }
        }

        // Add custom headers (these can override the API key header if needed)
        Object.assign(headers, this.customHeaders);

        return headers;
    }

    /**
     * Discover metrics for a given app and namespace
     * If Prometheus URL is not configured, returns mock data
     */
    async discoverMetrics(appName: string, namespace: string): Promise<PrometheusMetric[]> {
        if (!this.prometheusUrl) {
            logger.log(`No PROMETHEUS_URL configured, using mock data for app="${appName}", namespace="${namespace}"`, "info");
            return this.getMockMetrics(appName, namespace);
        }

        try {
            // Query Prometheus API for metrics with specific labels
            // Example: /api/v1/series?match[]={app="my-app",namespace="production"}
            const url = `${this.prometheusUrl}/api/v1/series?match[]={app="${appName}",namespace="${namespace}"}`;
            const headers = this.buildHeaders();

            // Log request details (hide sensitive info)
            logger.log(`🔍 Querying Prometheus...`, "info");
            logger.log(`  URL: ${url}`, "info");
            logger.log(`  Headers:`, "info", this.sanitizeHeadersForLog(headers));

            const response = await fetch(url, {
                headers: headers,
            });

            logger.log(`  Response Status: ${response.status} ${response.statusText}`, "info");

            if (!response.ok) {
                const errorText = await response.text();
                logger.log(`❌ Prometheus API error:`, "error");
                logger.log(`  Status: ${response.status} ${response.statusText}`, "error");
                logger.log(`  Response: ${errorText.substring(0, 500)}`, "error");
                throw new Error(`Prometheus API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            logger.log(`  Response data status: ${data.status}`, "info");

            // Extract unique metric names from series
            const metricNames = new Set<string>();
            if (data.status === "success" && Array.isArray(data.data)) {
                data.data.forEach((series: any) => {
                    if (series.__name__) {
                        metricNames.add(series.__name__);
                    }
                });
                logger.log(`✅ Discovered ${metricNames.size} unique metrics`, "info");
            } else {
                logger.log(`⚠️  Unexpected response format`, "error", data);
            }

            // Convert to PrometheusMetric format
            // Note: Real Prometheus doesn't provide type/help via series endpoint
            // You'd need to query /api/v1/metadata or parse from /metrics endpoint
            return Array.from(metricNames).map(name => ({
                name,
                type: "unknown", // Would need additional API call to get type
                help: undefined
            }));

        } catch (error: any) {
            logger.log(`❌ Failed to query Prometheus:`, "error");
            logger.log(`  Error: ${error.message}`, "error");
            if (error.cause) {
                logger.log(`  Cause: ${error.cause}`, "error");
            }
            if (error.stack) {
                logger.log(`  Stack: ${error.stack.split('\n').slice(0, 3).join('\n')}`, "error");
            }
            logger.log(`⚠️  Falling back to mock data`, "info");
            return this.getMockMetrics(appName, namespace);
        }
    }

    /**
     * Sanitize headers for logging (hide sensitive information)
     */
    private sanitizeHeadersForLog(headers: HeadersInit): Record<string, string> {
        const sanitized: Record<string, string> = {};
        const headersObj = headers as Record<string, string>;

        for (const [key, value] of Object.entries(headersObj)) {
            if (key.toLowerCase() === 'authorization') {
                // Show only the auth type, hide the actual token
                const parts = value.split(' ');
                if (parts.length === 2) {
                    sanitized[key] = `${parts[0]} ***${parts[1].substring(parts[1].length - 8)}`;
                } else {
                    sanitized[key] = '***';
                }
            } else if (key.toLowerCase().includes('key') || key.toLowerCase().includes('token')) {
                // Hide API keys and tokens
                sanitized[key] = `***${value.substring(value.length - 4)}`;
            } else {
                sanitized[key] = value;
            }
        }

        return sanitized;
    }

    /**
     * Returns mock metrics for testing
     */
    private getMockMetrics(appName: string, namespace: string): PrometheusMetric[] {
        // Simulate filtering by returning all mock metrics
        // In a real scenario, we'd filter based on actual label values
        return MOCK_METRICS;
    }
}

export const prometheusClient = new PrometheusClient();
