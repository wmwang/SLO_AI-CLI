import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
});

export const analyzeManifest = async (k8sManifests: string) => {
    const response = await api.post('/analyze-manifest', { k8sManifests });
    return response.data;
};

export const generateArtifacts = async (selectedSLOs: any[]) => {
    const response = await api.post('/generate-artifacts', { selectedSLOs });
    return response.data;
};

export const optimizeSLOs = async (metricsData: string, slos?: any[]) => {
    // Pass slos if available (loaded from state or passed directly)
    const response = await api.post('/optimize', { metricsData, slos });
    return response.data;
};

export const checkMemory = async () => {
    const response = await api.get('/state');
    return response.data;
};
