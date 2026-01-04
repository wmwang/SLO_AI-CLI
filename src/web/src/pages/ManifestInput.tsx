import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyzeManifest } from '../api';

const ManifestInput: React.FC = () => {
    const [manifest, setManifest] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                setManifest(ev.target?.result as string);
            };
            reader.readAsText(file);
        }
    };

    const handleSubmit = async () => {
        if (!manifest.trim()) return;
        setIsLoading(true);
        setError('');
        try {
            const result = await analyzeManifest(manifest);
            // Navigate to selection page with state
            // In React Router v6, use state prop
            navigate('/select-slos', { state: { recommendedSLOs: result.recommendedSLOs } });
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.error || 'Failed to analyze manifest.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ textAlign: 'left', maxWidth: '800px', margin: '0 auto' }}>
            <h2>Input Kubernetes Manifests</h2>
            <p style={{ color: '#aaa' }}>Paste your YAML content here or upload a file.</p>

            <div style={{ margin: '1rem 0' }}>
                <input type="file" accept=".yaml,.yml,.json" onChange={handleFileUpload} style={{ padding: '10px 0' }} />
            </div>

            <textarea
                rows={15}
                value={manifest}
                onChange={(e) => setManifest(e.target.value)}
                placeholder="apiVersion: apps/v1..."
            />

            {error && <p style={{ color: 'red' }}>{error}</p>}

            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button className="btn" onClick={() => navigate('/')}>Back</button>
                <button
                    className="btn btn-primary"
                    onClick={handleSubmit}
                    disabled={isLoading || !manifest.trim()}
                >
                    {isLoading ? 'Analyzing with AI...' : 'Analyze & Recommend'}
                </button>
            </div>
        </div>
    );
};

export default ManifestInput;
