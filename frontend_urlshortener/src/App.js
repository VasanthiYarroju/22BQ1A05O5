import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import UrlShortenerPage from './pages/ShortenerPage';
import UrlStatisticsPage from './pages/UrlStatisticspage';
import logger from './utils/logger';
import './App.css';

function App() {
  logger.event('APP_START', { message: 'Application has started successfully.' });

  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <h1 className="App-title">URL Shortener</h1> {/* Changed to avoid "AffordMed" */}
          <nav className="App-nav">
            <Link to="/" className="App-nav-link">Shorten URL</Link>
            <Link to="/statistics" className="App-nav-link">Statistics</Link>
          </nav>
        </header>
        <main className="App-main">
          <Routes>
            <Route path="/" element={<UrlShortenerPage />} />
            <Route path="/statistics" element={<UrlStatisticsPage />} />
            <Route path="*" element={
              <div className="page-not-found">
                <h2>404 - Page Not Found</h2>
                <p>The page you are looking for does not exist.</p>
                <Link to="/" className="button-base primary-button">Go to Shortener Page</Link>
              </div>
            } />
          </Routes>
        </main>
        <footer className="App-footer">
            <p>© {new Date().getFullYear()} URL Shortener. All rights reserved.</p> {/* Changed to avoid "AffordMed" */}
        </footer>
      </div>
    </Router>
  );
}

export default App;