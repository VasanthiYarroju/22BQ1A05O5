// Frontend/src/api/apiService.js
import logger from '../utils/logger';

const API_BASE_URL = 'http://20.244.56.144/evaluation-service';
const APP_BASE_URL = 'http://localhost:3000'; // Base URL for your React app for constructing full short URLs

const CLIENT_ID = process.env.REACT_APP_CLIENT_ID;
const CLIENT_SECRET = process.env.REACT_APP_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  logger.error("API credentials (CLIENT_ID or CLIENT_SECRET) are missing. Please ensure your Frontend/.env file is configured correctly.");
}

const callApi = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'client-id': CLIENT_ID,
    'client-secret': CLIENT_SECRET,
  };

  const headers = { ...defaultHeaders, ...options.headers };

  logger.info(`Attempting API call: ${options.method || 'GET'} ${url}`, { body: options.body });
  logger.event("API_CALL_ATTEMPT", { url: url, method: options.method || 'GET', bodySent: options.body ? true : false });

  try {
    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (jsonError) {
        errorData = { message: `HTTP error! status: ${response.status}`, rawResponse: await response.text() };
      }
      const errorMessage = errorData.message || `API call failed with status ${response.status}`;
      logger.error(`API Error for ${url}: ${response.status} ${response.statusText}`, errorData);
      logger.event("API_CALL_ERROR", { url: url, status: response.status, statusText: response.statusText, errorDetails: errorData });
      throw new Error(errorMessage);
    }

    const data = await response.json();
    logger.info(`API call successful for ${url}`, data);
    logger.event("API_CALL_SUCCESS", { url: url, dataReceived: data });
    return data;

  } catch (error) {
    logger.error(`Network or unexpected error during API call to ${url}:`, error.message, error);
    logger.event("API_CALL_NETWORK_ERROR", { url: url, errorMessage: error.message });
    throw error;
  }
};

export { APP_BASE_URL }; // Export the app base URL for link construction
export default callApi;