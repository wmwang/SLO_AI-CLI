import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkMemory, optimizeSLOs } from '../api';

const Optimize: React.FC = () => {
    const [metricsData, setMetricsData] = useState('');
    const [hasMemory, setHasMemory] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [report, setReport] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        checkMemory().then(res => {
            if (res.exists) {
                setHasMemory(true);
            }
        });
    }, []);

    const handleOptimize = async () => {
        if (!metricsData.trim()) return;
        setIsLoading(true);
        try {
            const result = await optimizeSLOs(metricsData); // API handles memory context injection
            setReport(result.optimizationReport);
        } catch (err) {
            console.error(err);
            alert("Failed to optimize.");
        } finally {
            setIsLoading(false);
        }
    };

    if (report) {
        return (
            <div style={{ textAlign: 'left', maxWidth: '800px', margin: '0 auto' }}>
                <h2>📋 Optimization Report</h2>
                <div className="card" style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', lineHeight: 1.6 }}>
                    {report}
                </div>
                <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                    <button className="btn" onClick={() => setReport('')}>New Optimization</button>
                    <button className="btn" style={{ marginLeft: '1rem' }} onClick={() => navigate('/')}>Home</button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ textAlign: 'left', maxWidth: '800px', margin: '0 auto' }}>
            <h2>Optimize Existing SLOs</h2>
            <div style={{ marginBottom: '1rem' }}>
                {hasMemory ? (
                    <div style={{ display: 'inline-block', background: 'rgba(0, 255, 157, 0.1)', border: '1px solid #00ff9d', color: '#00ff9d', padding: '5px 12px', borderRadius: '20px', fontSize: '0.9em' }}>
                        ✨ Memory Loaded (Context from previous run)
                    </div>
                ) : (
                    <p style={{ color: '#aaa' }}>No previous context found.</p>
                )}
            </div>

            <p>Paste your Metrics Data (Prometheus query results) or context here:</p>
            <textarea
                rows={10}
                value={metricsData}
                onChange={(e) => setMetricsData(e.target.value)}
                placeholder="e.g. error_rate{job='app'} = 0.5..."
            />

            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button className="btn" onClick={() => navigate('/')}>Back</button>
                <button
                    className="btn btn-primary"
                    onClick={handleOptimize}
                    disabled={isLoading || !metricsData.trim()}
                >
                    {isLoading ? 'Thinking...' : 'Analyze & Optimize'}
                </button>
            </div>
        </div>
    );
};

export default Optimize;
