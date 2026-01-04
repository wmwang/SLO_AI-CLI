import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Welcome from './pages/Welcome';
import ManifestInput from './pages/ManifestInput';
import Optimize from './pages/Optimize';
import SLOSelection from './pages/SLOSelection';
import './App.css';

// Minimal inline css for App header
const Header = () => (
  <header style={{ marginBottom: '2rem' }}>
    <h1 className="title-gradient">AI SLO Agent</h1>
    <p style={{ color: '#888' }}>Intelligent Service Level Objective Generator</p>
  </header>
);

function App() {
  return (
    <Router>
      <Header />
      <div className="card">
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/new" element={<ManifestInput />} />
          <Route path="/select-slos" element={<SLOSelection />} />
          <Route path="/optimize" element={<Optimize />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
