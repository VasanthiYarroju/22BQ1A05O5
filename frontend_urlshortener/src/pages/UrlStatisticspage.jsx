import React, { useState, useEffect } from 'react';
import apiService from '../api/apiService';
import logger from '../utils/logger';

function UrlStatisticsPage() {
  const [shortenedUrls, setShortenedUrls] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedClicks, setExpandedClicks] = useState({}); // State to track which URL's clicks are expanded

  useEffect(() => {
    const fetchStatistics = async () => {
      setIsLoading(true);
      setError('');
      logger.event('STATISTICS_PAGE_LOAD', { message: 'Fetching URL statistics.' });

      try {
        // Retrieve locally persisted URLs
        const localUrls = JSON.parse(localStorage.getItem('shortenedUrls') || '[]');
        logger.info('Loaded URLs from local storage:', localUrls);

        if (localUrls.length === 0) {
          setIsLoading(false);
          logger.info('No URLs found in local storage to fetch statistics for.');
          return;
        }

        // For each locally stored URL, fetch its click count and details
        const urlsWithStats = await Promise.all(
          localUrls.map(async (urlData) => {
            try {
              // The API documentation implies a /clicks endpoint or part of /shorten
              // Let's assume an endpoint like /clicks/{shortcode} or /shorten/{shortcode}/clicks
              // If the API provided only allows /clicks and expects query params, adjust accordingly.
              // Given "Click details", assuming an endpoint that returns specific click objects.
              // For demonstration, let's assume /shorten/{shortcode}/clicks
              // Fallback to simpler if only /clicks is available and it lists all.
              
              // We need the 'shortcode' from the shortened URL to query click details.
              const shortcode = urlData.shortcode; // Assumes shortcode is stored from creation

              if (!shortcode) {
                  logger.warn(`Shortcode missing for URL: ${urlData.shortenedUrl}. Cannot fetch clicks.`);
                  return { ...urlData, clicks: { count: 0, details: [] } };
              }

              logger.info(`Fetching click data for shortcode: ${shortcode}`);
              const clickResponse = await apiService(`/shorten/${shortcode}/clicks`, {
                method: 'GET',
              });

              // Assuming clickResponse is an array of click objects: [{ timestamp, source, geo_location }]
              const clickDetails = Array.isArray(clickResponse) ? clickResponse : [];
              logger.debug(`Click data for ${shortcode}:`, clickDetails);

              return {
                ...urlData,
                clicks: {
                  count: clickDetails.length,
                  details: clickDetails,
                },
              };
            } catch (clickError) {
              logger.error(`Failed to fetch click data for ${urlData.shortenedUrl}:`, clickError);
              return { ...urlData, clicks: { count: 0, details: [], error: clickError.message } };
            }
          })
        );
        setShortenedUrls(urlsWithStats);
        logger.event('STATISTICS_FETCH_SUCCESS', { count: urlsWithStats.length });
      } catch (err) {
        setError(`Failed to load statistics: ${err.message}`);
        logger.error('Error fetching statistics:', err);
        logger.event('STATISTICS_FETCH_ERROR', { errorMessage: err.message });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatistics();
  }, []); // Empty dependency array means this runs once on mount

  const toggleClickDetails = (shortcode) => {
    setExpandedClicks(prev => ({
      ...prev,
      [shortcode]: !prev[shortcode],
    }));
    logger.log(`Toggled click details for shortcode: ${shortcode}. New state: ${!expandedClicks[shortcode]}`);
  };

  if (isLoading) {
    return (
      <div className="statistics-page-container">
        <h2>URL Statistics</h2>
        <p className="no-data-message">Loading statistics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="statistics-page-container">
        <h2>URL Statistics</h2>
        <p className="form-message error">{error}</p>
      </div>
    );
  }

  if (shortenedUrls.length === 0) {
    return (
      <div className="statistics-page-container">
        <h2>URL Statistics</h2>
        <p className="no-data-message">No shortened URLs found. Shorten some URLs on the <a href="/" className="link">Shorten URL page</a>!</p>
      </div>
    );
  }

  return (
    <div className="statistics-page-container">
      <h2>Your Shortened URL Statistics</h2>
      <table className="statistics-table">
        <thead>
          <tr>
            <th>Shortened URL</th>
            <th>Original URL</th>
            <th>Expiry Time</th>
            <th>Clicks</th>
            <th>Click Details</th>
          </tr>
        </thead>
        <tbody>
          {shortenedUrls.map((urlData) => (
            <React.Fragment key={urlData.shortenedUrl}>
              <tr>
                <td><a href={urlData.shortenedUrl} target="_blank" rel="noopener noreferrer">{urlData.shortenedUrl}</a></td>
                <td><a href={urlData.originalUrl} target="_blank" rel="noopener noreferrer">{urlData.originalUrl}</a></td>
                <td>{urlData.expiryTime ? new Date(urlData.expiryTime).toLocaleString() : 'N/A'}</td>
                <td>{urlData.clicks ? urlData.clicks.count : 'N/A'}</td>
                <td>
                  {urlData.clicks && urlData.clicks.count > 0 ? (
                    <button
                      className="click-details-toggle"
                      onClick={() => toggleClickDetails(urlData.shortcode)}
                    >
                      {expandedClicks[urlData.shortcode] ? 'Hide Details' : 'Show Details'}
                    </button>
                  ) : (
                    <span style={{ color: '#888' }}>No clicks yet</span>
                  )}
                  {urlData.clicks && urlData.clicks.error && (
                      <p className="error-message" style={{marginTop: '5px', marginBottom: '0'}}>
                          Failed to load clicks: {urlData.clicks.error}
                      </p>
                  )}
                </td>
              </tr>
              {expandedClicks[urlData.shortcode] && urlData.clicks && urlData.clicks.details && urlData.clicks.details.length > 0 && (
                <tr>
                  <td colSpan="5">
                    <ul className="click-details-list">
                      {urlData.clicks.details.map((click, idx) => (
                        <li key={idx}>
                          <strong>Timestamp:</strong> {new Date(click.timestamp).toLocaleString()}{' '}
                          {click.source && <span> | <strong>Source:</strong> {click.source}</span>}{' '}
                          {click.geo_location && <span> | <strong>Location:</strong> {click.geo_location}</span>}
                        </li>
                      ))}
                    </ul>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default UrlStatisticsPage;