import React from 'react';

/**
 * ErrorDisplay component for showing errors with details
 * @param {string} error - The error message to display
 * @param {Object} styles - Optional styles object
 */
function ErrorDisplay({ error, styles = {} }) {
  // Default styles for error display
  const defaultStyles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      padding: '2rem',
      color: '#dc2626',
      backgroundColor: '#fef2f2',
      textAlign: 'center'
    },
    icon: {
      fontSize: '3rem',
      marginBottom: '1rem'
    },
    heading: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      marginBottom: '1rem'
    },
    message: {
      marginBottom: '1.5rem',
      maxWidth: '700px',
      lineHeight: '1.6'
    },
    details: {
      textAlign: 'left',
      backgroundColor: '#fff',
      border: '1px solid #f3f4f6',
      borderRadius: '0.375rem',
      padding: '1rem',
      width: '100%',
      maxWidth: '700px',
      overflowX: 'auto',
      fontFamily: 'monospace',
      fontSize: '0.875rem',
      marginBottom: '1.5rem'
    },
    help: {
      color: '#4b5563',
      fontSize: '0.875rem',
      marginBottom: '1rem'
    },
    button: {
      backgroundColor: '#2563eb',
      color: 'white',
      border: 'none',
      borderRadius: '0.25rem',
      padding: '0.5rem 1rem',
      cursor: 'pointer',
      fontWeight: 'bold'
    }
  };
  
  // Combine default styles with any passed styles
  const mergedStyles = {
    container: { ...defaultStyles.container, ...(styles.container || {}) },
    icon: { ...defaultStyles.icon, ...(styles.icon || {}) },
    heading: { ...defaultStyles.heading, ...(styles.heading || {}) },
    message: { ...defaultStyles.message, ...(styles.message || {}) },
    details: { ...defaultStyles.details, ...(styles.details || {}) },
    help: { ...defaultStyles.help, ...(styles.help || {}) },
    button: { ...defaultStyles.button, ...(styles.button || {}) }
  };
  
  // Handle reload button click
  const handleReload = () => {
    window.location.reload();
  };
  
  return (
    <div style={mergedStyles.container}>
      <div style={mergedStyles.icon}>⚠️</div>
      <h1 style={mergedStyles.heading}>Connection Error</h1>
      <p style={mergedStyles.message}>{error}</p>
      
      <div style={mergedStyles.details}>
        <strong>Possible causes:</strong>
        <ul>
          <li>The backend service is not running</li>
          <li>MongoDB connection is misconfigured or unavailable</li>
          <li>Network connectivity issues between services</li>
          <li>Incorrect API_ENDPOINT configuration</li>
        </ul>
        
        <strong>Suggested actions:</strong>
        <ul>
          <li>Check backend logs: <code>docker-compose logs backend</code></li>
          <li>Verify MongoDB URI in .env file</li>
          <li>Ensure MONGODB_URI environment variable is passed to backend</li>
          <li>Check network connectivity between services</li>
        </ul>
      </div>
      
      <p style={mergedStyles.help}>
        Check application logs for more detailed error information.
      </p>
      
      <button style={mergedStyles.button} onClick={handleReload}>
        Reload Page
      </button>
    </div>
  );
}

export default ErrorDisplay;