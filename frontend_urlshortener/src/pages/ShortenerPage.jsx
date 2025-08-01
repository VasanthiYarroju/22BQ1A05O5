import React, { useState } from 'react';

const MAX_URL_INPUTS = 5;
const DEFAULT_VALIDITY_MINUTES = 30;
let nextId = 0;

const createInitialUrlInput = () => ({
  id: nextId++,
  longUrl: '',
});

function UrlShortenerPage() {
  const [urlInputs, setUrlInputs] = useState([createInitialUrlInput()]);
  const [errors, setErrors] = useState({});
  const [shortenedUrls, setShortenedUrls] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleInputChange = (id, event) => {
    const { name, value } = event.target;

    setUrlInputs((prev) =>
      prev.map((input) =>
        input.id === id ? { ...input, [name]: value } : input
      )
    );

    const errorKey = `${id}-${name}`;
    const newErrors = { ...errors };
    let error = '';

    if (name === 'longUrl' && value && !isValidUrl(value)) {
      error = 'Invalid URL format (e.g., https://example.com)';
    }

    if (error) {
      newErrors[errorKey] = error;
    } else {
      delete newErrors[errorKey];
    }

    setErrors(newErrors);
  };

  const handleAddUrlInput = () => {
    if (urlInputs.length < MAX_URL_INPUTS) {
      setUrlInputs((prev) => [...prev, createInitialUrlInput()]);
      setMessage('');
      setMessageType('');
    } else {
      setMessage(`You can only shorten up to ${MAX_URL_INPUTS} URLs at a time.`);
      setMessageType('info');
    }
  };

  const handleRemoveUrlInput = (id) => {
    if (urlInputs.length > 1) {
      const newInputs = urlInputs.filter((input) => input.id !== id);
      const newErrors = {};

      Object.keys(errors).forEach((key) => {
        if (!key.startsWith(`${id}-`)) {
          newErrors[key] = errors[key];
        }
      });

      setErrors(newErrors);
      setUrlInputs(newInputs);
    } else {
      setMessage('At least one URL input is required.');
      setMessageType('error');
    }
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setMessage('');
  setMessageType('');
  setIsLoading(true);
  setShortenedUrls([]);
  setErrors({});

  const newErrors = {};
  const urlsToProcess = urlInputs.filter((input) => input.longUrl.trim() !== '');

  if (urlsToProcess.length === 0) {
    setMessage('Please enter at least one valid URL.');
    setMessageType('error');
    setIsLoading(false);
    return;
  }

  urlsToProcess.forEach((input) => {
    if (!isValidUrl(input.longUrl)) {
      newErrors[`${input.id}-longUrl`] = 'Invalid URL format.';
    }
  });

  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors);
    setMessage('Please fix the errors in the form.');
    setMessageType('error');
    setIsLoading(false);
    return;
  }

  const results = [];

  for (const input of urlsToProcess) {
    try {
      const proxyUrl = 'https://api.allorigins.win/raw?url=' +
        encodeURIComponent('https://cleanuri.com/api/v1/shorten');

      const res = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ url: input.longUrl }),
      });

      const data = await res.json();

      if (data.result_url) {
        results.push({
          originalUrl: input.longUrl,
          shortenedUrl: data.result_url,
        });
      } else {
        results.push({
          originalUrl: input.longUrl,
          shortenedUrl: 'Failed to shorten',
        });
      }
    } catch {
      results.push({
        originalUrl: input.longUrl,
        shortenedUrl: 'Request failed',
      });
    }
  }

  setShortenedUrls(results);
  setIsLoading(false);
  setMessage('URLs processed.');
  setMessageType('success');
};

  return (
    <div className="shortener-page">
      <h2>Shorten Your URLs</h2>
      <form onSubmit={handleSubmit}>
        {urlInputs.map((input, index) => (
          <div key={input.id} className="url-input-group">
            <h4>URL #{index + 1}</h4>

            <div className="form-field">
              <label htmlFor={`longUrl-${input.id}`}>Long URL:</label>
              <input
                type="text"
                name="longUrl"
                id={`longUrl-${input.id}`}
                value={input.longUrl}
                onChange={(e) => handleInputChange(input.id, e)}
                placeholder="https://example.com"
                required
              />
              {errors[`${input.id}-longUrl`] && (
                <p className="error-message">{errors[`${input.id}-longUrl`]}</p>
              )}
            </div>

            {urlInputs.length > 1 && (
              <button type="button" onClick={() => handleRemoveUrlInput(input.id)}>
                Remove
              </button>
            )}
          </div>
        ))}

        {urlInputs.length < MAX_URL_INPUTS && (
          <button type="button" onClick={handleAddUrlInput}>
            + Add Another URL
          </button>
        )}

        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Shortening...' : 'Shorten URLs'}
        </button>
      </form>

      {message && (
        <div className={`form-message ${messageType}`}>{message}</div>
      )}

      {shortenedUrls.length > 0 && (
        <div className="shortened-results">
          <h3>Results:</h3>
          {shortenedUrls.map((url, idx) => (
            <div key={idx} className="shortened-item">
              <p>
                <strong>Original:</strong>{' '}
                <a href={url.originalUrl} target="_blank" rel="noopener noreferrer">
                  {url.originalUrl}
                </a>
              </p>
              <p>
                <strong>Shortened:</strong>{' '}
                <a href={url.shortenedUrl} target="_blank" rel="noopener noreferrer">
                  {url.shortenedUrl}
                </a>
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default UrlShortenerPage;
