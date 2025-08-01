// Frontend/src/pages/UrlShortenerPage.js
import React, { useState } from 'react';
import apiService, { APP_BASE_URL } from '../api/apiService';
import logger from '../utils/logger';

// Constants for validation
const MAX_URL_INPUTS = 5;
const DEFAULT_VALIDITY_MINUTES = 30; // From requirements
const SHORTCODE_PATTERN = /^[a-zA-Z0-9_-]{4,16}$/; // Alphanumeric, hyphen, underscore, 4-16 chars

// Helper to generate a unique ID for each URL input.
// Using a simple counter for demo. In a real app, consider uuid or similar.
let nextId = 0;
const createInitialUrlInput = () => ({
  id: nextId++, // Assign a unique ID to each new input
  longUrl: '',
  validity: DEFAULT_VALIDITY_MINUTES,
  customShortcode: ''
});

function UrlShortenerPage() {
  // Initialize with one input field, using the new createInitialUrlInput helper
  const [urlInputs, setUrlInputs] = useState([createInitialUrlInput()]);
  const [errors, setErrors] = useState({});
  const [shortenedUrls, setShortenedUrls] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
const [messageType, setMessageType] = useState(''); // 'success', 'error', 'info'

  // Helper function for URL validation
  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };

  // Helper function for validity validation
  const isValidValidity = (validity) => {
    const num = Number(validity);
    return !isNaN(num) && num > 0; // Must be a positive number
  };

  // Helper function for shortcode validation
  const isValidShortcode = (shortcode) => {
    if (!shortcode) return true; // Shortcode is optional
    return SHORTCODE_PATTERN.test(shortcode);
  };

  // Handles changes in input fields
  const handleInputChange = (id, event) => { // Now accepts 'id' of the input group
    const { name, value } = event.target;
    setUrlInputs(prevInputs => { // Use functional update for correct state
      const newInputs = prevInputs.map(input =>
        input.id === id ? { ...input, [name]: value } : input
      );

      // Live validation: Clear or set error for the changed field
      const fieldErrorKey = `${id}-${name}`; // Use id for the error key as well
      const newErrors = { ...errors };

      let error = '';
      if (name === 'longUrl' && value && !isValidUrl(value)) {
        error = 'Invalid URL format (e.g., https://example.com).';
      } else if (name === 'validity' && value && !isValidValidity(value)) {
        error = 'Validity must be a positive number of minutes.';
      } else if (name === 'customShortcode' && value && !isValidShortcode(value)) {
        error = `Shortcode must be 4-16 alphanumeric, hyphens, or underscores.`;
      }

      if (error) {
        newErrors[fieldErrorKey] = error;
      } else {
        delete newErrors[fieldErrorKey];
      }
      setErrors(newErrors); // Update errors based on the change
      return newInputs; // Return updated state
    });
  };

  // Adds a new URL input form, up to MAX_URL_INPUTS
  const handleAddUrlInput = () => {
    logger.debug("handleAddUrlInput called."); // Debug log to confirm function call
    if (urlInputs.length < MAX_URL_INPUTS) {
      setUrlInputs(prevInputs => [...prevInputs, createInitialUrlInput()]); // Add a new input with unique ID
      setMessage(''); setMessageType(''); // Clear any previous messages
      logger.log(`Added a new URL input field. Total: ${urlInputs.length + 1}`);
    } else {
      setMessage(`You can only shorten up to ${MAX_URL_INPUTS} URLs at a time.`);
      setMessageType('info'); // Changed to info, not error for exceeding limit
      logger.warn(`Attempted to add more than ${MAX_URL_INPUTS} URL input fields.`);
    }
  };

  // Removes a URL input form
  const handleRemoveUrlInput = (idToRemove) => { // Now accepts 'id' of the input group to remove
    if (urlInputs.length > 1) { // Ensure at least one input remains
      setUrlInputs(prevInputs => {
        const newUrlInputs = prevInputs.filter(input => input.id !== idToRemove);

        // Clean up errors related to the removed input's ID
        const newErrors = {};
        Object.keys(errors).forEach(key => {
          const [errIdStr, errName] = key.split('-');
          if (errIdStr !== String(idToRemove)) { // Convert idToRemove to string for comparison
            newErrors[key] = errors[key];
          }
        });
        setErrors(newErrors);
        setMessage(''); setMessageType(''); // Clear any previous messages
        logger.log(`Removed URL input field with ID ${idToRemove}. Total: ${newUrlInputs.length}`);
        return newUrlInputs;
      });
    } else {
      setMessage('At least one URL input field is required.');
      setMessageType('error');
      logger.warn('Attempted to remove the last URL input field.');
    }
  };

  // Handles the form submission
  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setMessageType('');
    setShortenedUrls([]);
    setErrors({}); // Clear all errors at start of submission
    setIsLoading(true);
    logger.event('SHORTEN_REQUEST_INITIATED', { numUrls: urlInputs.length });

    const newErrors = {};
    let hasOverallError = false;

    // Filter out completely empty rows for submission unless it's the only row
    // A row is considered "empty" if longUrl is empty AND customShortcode is empty AND validity is default/empty.
    const urlsToProcess = urlInputs.filter(input =>
      input.longUrl.trim() !== '' ||
      input.customShortcode.trim() !== '' ||
      (input.validity !== DEFAULT_VALIDITY_MINUTES && input.validity !== '') // If validity is changed from default or is not empty
    );

    if (urlsToProcess.length === 0) {
      setMessage('Please enter at least one URL to shorten.');
      setMessageType('error');
      setIsLoading(false);
      logger.warn('Shorten request aborted: No URLs provided after filtering empty rows.');
      return;
    }

    // Full validation pass for all inputs to be submitted (only for the ones we're actually processing)
    urlsToProcess.forEach(input => {
      const currentInputId = input.id; // Use the unique ID for error mapping

      if (input.longUrl.trim() === '') {
          newErrors[`${currentInputId}-longUrl`] = 'Original URL cannot be empty.';
          hasOverallError = true;
      } else if (!isValidUrl(input.longUrl)) {
          newErrors[`${currentInputId}-longUrl`] = 'Invalid URL format (e.g., https://example.com).';
          hasOverallError = true;
      }

      if (input.validity && !isValidValidity(input.validity)) {
        newErrors[`${currentInputId}-validity`] = 'Validity must be a positive number of minutes.';
        hasOverallError = true;
      }
      if (input.customShortcode && !isValidShortcode(input.customShortcode)) {
        newErrors[`${currentInputId}-customShortcode`] = `Shortcode must be 4-16 alphanumeric, hyphens, or underscores.`;
        hasOverallError = true;
      }
    });

    if (hasOverallError) {
      setErrors(newErrors);
      setMessage('Please correct the errors in the form.');
      setMessageType('error');
      setIsLoading(false);
      logger.error('Shorten request aborted: Client-side validation failed.', { errors: newErrors });
      return;
    }

    // Prepare requests for the API (only valid, non-empty ones)
    const requests = urlsToProcess.map(input => ({
      longUrl: input.longUrl,
      validityInMinutes: input.validity ? Number(input.validity) : DEFAULT_VALIDITY_MINUTES,
      customShortcode: input.customShortcode.trim() || undefined, // Send undefined if empty
    }));

    try {
      // The prompt says "User can shorten up to 5 URLs at a time."
      // This usually implies sending them sequentially or in a batch call.
      // Based on typical backend designs and the /shorten API, it's safer to assume
      // individual calls are expected unless a /shorten/batch endpoint is explicitly stated.
      // We will loop through and send each request individually.
      const results = [];
      for (const req of requests) {
        logger.info('Sending single shorten request:', req);
        const response = await apiService('/shorten', {
          method: 'POST',
          body: JSON.stringify(req),
        });
        // The API returns 'shortcode' and 'expiryTime'
        // Construct the full shortened URL for display and persistence
        const fullShortenedUrl = `${APP_BASE_URL}/${response.shortcode}`;

        results.push({
            originalUrl: req.longUrl,
            shortenedUrl: fullShortenedUrl,
            expiryTime: response.expiryTime,
            shortcode: response.shortcode, // Store the shortcode for statistics page API calls
        });
      }

      setShortenedUrls(results);
      setMessage('URLs shortened successfully!');
      setMessageType('success');
      setErrors({}); // Clear all errors on successful submission

      // Client-side persistence for URL Statistics Page
      const existingUrls = JSON.parse(localStorage.getItem('shortenedUrls') || '[]');
      localStorage.setItem('shortenedUrls', JSON.stringify([...existingUrls, ...results]));
      logger.event('URL_SHORTENED_PERSISTED', { newUrls: results.map(u => u.shortenedUrl) });


      logger.event('SHORTEN_REQUEST_SUCCESS', { results: results });
      setUrlInputs([createInitialUrlInput()]); // Clear form, reset to one empty input

    } catch (error) {
      setMessage(`Error shortening URLs: ${error.message}`);
      setMessageType('error');
      logger.error('Error during URL shortening API call:', error);

      // No specific error handling for shortcode collision provided by API spec,
      // so general error message is sufficient based on catch block.
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="shortener-page-container">
      <h2>Shorten Your URLs</h2>
      <form onSubmit={handleSubmit}>
        {urlInputs.map((input) => ( // Removed 'index', using 'input' directly
          <div key={input.id} className="url-input-group"> {/* Use input.id for the key */}
            <h3>URL #{urlInputs.indexOf(input) + 1}</h3> {/* Still display number based on current order */}
            <div className="form-field">
              <label htmlFor={`longUrl-${input.id}`}>Original URL:</label> {/* Use input.id in htmlFor */}
              <input
                type="text"
                id={`longUrl-${input.id}`} // Use input.id in id
                name="longUrl"
                value={input.longUrl}
                onChange={(e) => handleInputChange(input.id, e)} // Pass input.id to handler
                placeholder="e.g., https://www.example.com/very/long/path"
                // Required if it's the only input, or if it's not empty (will be filtered otherwise)
                required={urlInputs.length === 1 || input.longUrl.trim() !== '' || input.customShortcode.trim() !== ''}
              />
              {errors[`${input.id}-longUrl`] && <p className="error-message">{errors[`${input.id}-longUrl`]}</p>}
            </div>

            <div className="form-field">
              <label htmlFor={`validity-${input.id}`}>Validity (minutes, optional):</label>
              <input
                type="number"
                id={`validity-${input.id}`}
                name="validity"
                value={input.validity}
                onChange={(e) => handleInputChange(input.id, e)}
                placeholder={`${DEFAULT_VALIDITY_MINUTES} (default)`}
                min="1"
              />
              {errors[`${input.id}-validity`] && <p className="error-message">{errors[`${input.id}-validity`]}</p>}
            </div>

            <div className="form-field">
              <label htmlFor={`customShortcode-${input.id}`}>Custom Shortcode (optional):</label>
              <input
                type="text"
                id={`customShortcode-${input.id}`}
                name="customShortcode"
                value={input.customShortcode}
                onChange={(e) => handleInputChange(input.id, e)}
                placeholder="e.g., myCustomLink (4-16 chars, alphanumeric, _-)"
                maxLength="16"
              />
              {errors[`${input.id}-customShortcode`] && <p className="error-message">{errors[`${input.id}-customShortcode`]}</p>}
            </div>

            {urlInputs.length > 1 && (
              <button
                type="button"
                className="button-base remove-url-button"
                onClick={() => handleRemoveUrlInput(input.id)} // Pass input.id to handler
              >
                Remove URL #{urlInputs.indexOf(input) + 1}
              </button>
            )}
          </div>
        ))}

        {urlInputs.length < MAX_URL_INPUTS && (
          <button type="button" className="button-base add-url-button" onClick={handleAddUrlInput}>
            + Add Another URL
          </button>
        )}

        <button type="submit" className="button-base submit-button" disabled={isLoading}>
          {isLoading ? 'Shortening...' : 'Shorten URLs'}
        </button>

        {message && (
          <p className={`form-message ${messageType === 'error' ? 'error' : messageType === 'info' ? 'info' : 'success'}`}>
            {message}
          </p>
        )}
      </form>

      {shortenedUrls.length > 0 && (
        <div className="shortened-results">
          <h3>Successfully Shortened URLs:</h3>
          {shortenedUrls.map((urlData, index) => ( // 'index' is fine here as this list is not manipulated dynamically
            <div key={index} className="shortened-item">
              <p><strong>Original:</strong> <a href={urlData.originalUrl} target="_blank" rel="noopener noreferrer">{urlData.originalUrl}</a></p>
              <p><strong>Shortened:</strong> <a href={urlData.shortenedUrl} target="_blank" rel="noopener noreferrer">{urlData.shortenedUrl}</a></p>
              {urlData.expiryTime && <p><strong>Expires:</strong> {new Date(urlData.expiryTime).toLocaleString()}</p>}
              {urlData.shortcode && <p><strong>Shortcode:</strong> {urlData.shortcode}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default UrlShortenerPage;