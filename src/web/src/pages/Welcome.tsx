import React from 'react';
import { useNavigate } from 'react-router-dom';

const Welcome: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', marginTop: '2rem' }}>
            <div className="card" style={{ width: '300px', cursor: 'pointer', textAlign: 'left' }} onClick={() => navigate('/new')}>
                <h3>🚀 New Deployment</h3>
                <p style={{ color: '#aaa' }}>
                    Generate SLOs for a new application.
                    Upload K8s manifests and let AI recommend the best indicators.
                </p>
                <br />
                <button className="btn btn-primary" style={{ width: '100%' }}>Generate SLOs &rarr;</button>
            </div>

            <div className="card" style={{ width: '300px', cursor: 'pointer', textAlign: 'left', borderColor: '#00ff9d' }} onClick={() => navigate('/optimize')}>
                <h3>💡 Optimize Existing</h3>
                <p style={{ color: '#aaa' }}>
                    Analyze current metrics and get AI-driven optimization advice (Burn Rate, Error Budget).
                </p>
                <br />
                <button className="btn" style={{ width: '100%', borderColor: '#00ff9d', color: '#00ff9d' }}>Optimize Now &rarr;</button>
            </div>
        </div>
    );
};

export default Welcome;
