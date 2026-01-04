import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { generateArtifacts } from '../api';

interface SLO {
    id: string;
    name: string;
    description: string;
    golden_signal: string;
    target: number;
    window: string;
    description_zh: string;
}

const SLOSelection: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const recommendedSLOs: SLO[] = location.state?.recommendedSLOs || [];

    // Default select all
    const [selectedIds, setSelectedIds] = useState<string[]>(recommendedSLOs.map(s => s.id));
    const [isGenerating, setIsGenerating] = useState(false);
    const [artifacts, setArtifacts] = useState<{ rules: string, dashboard: string } | null>(null);

    const toggleSLO = (id: string) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(sid => sid !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const selected = recommendedSLOs.filter(s => selectedIds.includes(s.id));
            const result = await generateArtifacts(selected);
            setArtifacts({
                rules: result.generatedRules,
                dashboard: result.generatedDashboard
            });
        } catch (err) {
            console.error(err);
            alert("Failed to generate artifacts.");
        } finally {
            setIsGenerating(false);
        }
    };

    const downloadFile = (filename: string, content: string) => {
        const element = document.createElement("a");
        const file = new Blob([content], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = filename;
        document.body.appendChild(element); // Required for this to work in FireFox
        element.click();
    };

    if (recommendedSLOs.length === 0) {
        return (
            <div>
                <h2>No SLOs found</h2>
                <button className="btn" onClick={() => navigate('/new')}>Go Back</button>
            </div>
        );
    }

    if (artifacts) {
        return (
            <div style={{ textAlign: 'left', maxWidth: '800px', margin: '0 auto' }}>
                <h2>🎉 Artifacts Generated!</h2>
                <p>Your monitoring configuration is ready.</p>

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                    <div className="card" style={{ flex: 1 }}>
                        <h4>Prometheus Rules</h4>
                        <button className="btn btn-primary" onClick={() => downloadFile('prometheus_rules.yaml', artifacts.rules)}>Download YAML</button>
                    </div>
                    <div className="card" style={{ flex: 1 }}>
                        <h4>Grafana Dashboard</h4>
                        <button className="btn btn-primary" onClick={() => downloadFile('dashboard.json', artifacts.dashboard)}>Download JSON</button>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                    <button className="btn" onClick={() => navigate('/')}>Home</button>
                    <button className="btn" onClick={() => navigate('/optimize')}>Proceed to Optimize &rarr;</button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ textAlign: 'left', maxWidth: '800px', margin: '0 auto', paddingBottom: '3rem' }}>
            <h2>Select SLOs</h2>
            <p style={{ color: '#aaa' }}>Choose which indicators you want to monitor.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {recommendedSLOs.map(slo => (
                    <div key={slo.id} className={`card ${selectedIds.includes(slo.id) ? 'selected-card' : ''}`}
                        style={{
                            border: selectedIds.includes(slo.id) ? '1px solid #00ff9d' : '1px solid transparent',
                            cursor: 'pointer'
                        }}
                        onClick={() => toggleSLO(slo.id)}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, color: selectedIds.includes(slo.id) ? '#00ff9d' : 'inherit' }}>{slo.name}</h3>
                            <span style={{
                                background: '#333', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8em',
                                color: slo.golden_signal === 'Errors' ? '#ff5252' : slo.golden_signal === 'Latency' ? '#ffd740' : '#40c4ff'
                            }}>
                                {slo.golden_signal}
                            </span>
                        </div>
                        <p style={{ fontSize: '0.9em' }}>{slo.description}</p>
                        <p style={{ fontSize: '0.85em', color: '#ccc', fontStyle: 'italic' }}>{slo.description_zh}</p>
                        <div style={{ marginTop: '0.5rem', fontSize: '0.9em', color: '#888' }}>
                            Target: <b>{slo.target}%</b> | Window: <b>{slo.window}</b>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ position: 'sticky', bottom: 20, marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem', background: '#1a1a1a', padding: '10px', borderRadius: '10px', border: '1px solid #333' }}>
                <span style={{ alignSelf: 'center' }}>{selectedIds.length} Selected</span>
                <button
                    className="btn btn-primary"
                    onClick={handleGenerate}
                    disabled={isGenerating || selectedIds.length === 0}
                >
                    {isGenerating ? 'Generating...' : 'Generate Artifacts'}
                </button>
            </div>
        </div>
    );
};

export default SLOSelection;
