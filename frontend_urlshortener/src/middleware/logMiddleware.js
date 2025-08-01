const logEvent = (eventName, details = {}) => {
  const timestamp = new Date().toISOString();

  const log = {
    event: eventName,
    timestamp,
    ...details,
  };

  const logs = JSON.parse(localStorage.getItem('logs') || '[]');
  logs.push(log);
  localStorage.setItem('logs', JSON.stringify(logs));
};

export default logEvent;
