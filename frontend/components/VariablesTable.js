import React, { useState, useEffect } from 'react';

/**
 * VariablesTable component for displaying and editing variables
 * @param {Object} variables - The variables object to display/edit
 * @param {string} itemId - The ID of the item (group or host)
 * @param {string} itemType - The type of item ('group' or 'host')
 * @param {Object} styles - The styles object for consistent UI
 */
function VariablesTable({ variables, itemId, itemType, styles }) {
  const [editMode, setEditMode] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [editingKey, setEditingKey] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [localVars, setLocalVars] = useState({...(variables || {})});
  
  // Synchronize local state with props when variables change
  useEffect(() => {
    setLocalVars({...(variables || {})});
  }, [variables]);
  
  // Add a new variable
  const handleAddVariable = () => {
    if (!newKey.trim()) return;
    
    // Create updated variables
    const updatedVars = {
      ...localVars,
      [newKey]: tryParseValue(newValue)
    };
    
    // Update local state
    setLocalVars(updatedVars);
    
    // Call API to save changes
    saveVariables(itemId, itemType, updatedVars);
    
    // Reset form
    setNewKey('');
    setNewValue('');
  };
  
  // Update an existing variable
  const handleUpdateVariable = (key) => {
    // Create updated variables
    const updatedVars = {
      ...localVars,
      [key]: tryParseValue(editValue)
    };
    
    // Update local state
    setLocalVars(updatedVars);
    
    // Call API to save changes
    saveVariables(itemId, itemType, updatedVars);
    
    // Exit edit mode
    setEditingKey(null);
  };
  
  // Delete a variable
  const handleDeleteVariable = (key) => {
    if (!confirm(`Are you sure you want to delete the variable "${key}"?`)) return;
    
    // Create updated variables
    const updatedVars = {...localVars};
    delete updatedVars[key];
    
    // Update local state
    setLocalVars(updatedVars);
    
    // Call API to save changes
    saveVariables(itemId, itemType, updatedVars);
  };
  
  // Try to parse string values as numbers or booleans if appropriate
  const tryParseValue = (value) => {
    // If it's a number, convert it
    if (!isNaN(value) && value.trim() !== '') {
      return Number(value);
    }
    
    // If it's a boolean, convert it
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
    
    // Otherwise keep as string
    return value;
  };
  
  // Format value for display and editing
  const formatValue = (value) => {
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  };
  
  // Function to save variables to the backend
  const saveVariables = async (id, type, varsData) => {
    try {
      // Get the base API endpoint from config
      let apiBase = window.CONFIG.API_ENDPOINT;
      
      console.log('Starting variable save operation:');
      console.log('- Item ID:', id);
      console.log('- Item Type:', type);
      console.log('- API Base:', apiBase);
      console.log('- Variables to save:', varsData);
      
      // If API_ENDPOINT ends with '/inventory', remove it to get the base URL
      if (apiBase.endsWith('/inventory')) {
        apiBase = apiBase.substring(0, apiBase.length - 10);
        console.log('- Modified API Base:', apiBase);
      }
      
      // Construct the full endpoint URL
      const endpoint = type === 'host' 
        ? `${apiBase}/inventory/hosts/${id}/vars`
        : `${apiBase}/inventory/groups/${id}/vars`;
      
      console.log(`- Full endpoint URL: ${endpoint}`);
      
      // Perform the API request
      console.log('Sending PUT request...');
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(varsData)
      });
      
      console.log(`Response status: ${response.status} ${response.statusText}`);
      
      // Check if the response is OK
      if (!response.ok) {
        let errorDetails;
        try {
          // Try to parse error details from response
          errorDetails = await response.json();
          console.error('Error response details:', errorDetails);
        } catch (e) {
          console.error('Could not parse error response:', e);
        }
        
        throw new Error(`Failed to update variables: ${response.statusText}`);
      }
      
      // Parse and log the response
      try {
        const responseData = await response.json();
        console.log('Response data:', responseData);
        
        if (responseData.success) {
          console.log(`Variables updated successfully for ${type} ${id}`);
        } else {
          console.warn('Response indicated no success flag:', responseData);
        }
      } catch (e) {
        console.warn('Could not parse response as JSON:', e);
      }
      
      console.log(`Variables updated for ${type} ${id}`);
    } catch (error) {
      console.error('Error saving variables:', error);
      console.error('Error stack:', error.stack);
      
      // More diagnostic information
      console.debug('Debug info for error:');
      console.debug('- Browser:', navigator.userAgent);
      console.debug('- Window location:', window.location.href);
      console.debug('- CONFIG:', window.CONFIG);
      
      alert(`Failed to save changes: ${error.message}\nCheck browser console for details.`);
    }
  };
  
  // If no variables and not in edit mode, show empty message
  if (!localVars || Object.keys(localVars).length === 0 && !editMode) {
    return (
      <div>
        <div style={styles.emptyMessage}>No variables defined</div>
        <div style={{ marginTop: '1rem' }}>
          <button 
            style={styles.button}
            onClick={() => setEditMode(true)}>
            Add Variable
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.tableHeader}>Variable</th>
            <th style={styles.tableHeader}>Value</th>
            {editMode && <th style={styles.tableHeader}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {Object.entries(localVars).map(([key, value]) => (
            <tr key={key}>
              <td style={styles.tableCell}>
                {editingKey === key ? (
                  <div style={styles.inputCell}>
                    <span style={styles.labelText}>{key}</span>
                  </div>
                ) : (
                  key
                )}
              </td>
              <td style={styles.tableCell}>
                {editingKey === key ? (
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    style={styles.input}
                  />
                ) : (
                  formatValue(value)
                )}
              </td>
              {editMode && (
                <td style={styles.tableCell}>
                  {editingKey === key ? (
                    <div style={styles.actionButtons}>
                      <button 
                        style={{...styles.smallButton, ...styles.saveButton}}
                        onClick={() => handleUpdateVariable(key)}>
                        Save
                      </button>
                      <button 
                        style={{...styles.smallButton, ...styles.cancelButton}}
                        onClick={() => setEditingKey(null)}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div style={styles.actionButtons}>
                      <button 
                        style={styles.smallButton}
                        onClick={() => {
                          setEditingKey(key);
                          setEditValue(formatValue(value));
                        }}>
                        Edit
                      </button>
                      <button 
                        style={{...styles.smallButton, ...styles.dangerButton}}
                        onClick={() => handleDeleteVariable(key)}>
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              )}
            </tr>
          ))}
          
          {/* Form to add new variable */}
          {editMode && (
            <tr>
              <td style={styles.tableCell}>
                <input
                  type="text"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  placeholder="New variable name"
                  style={styles.input}
                />
              </td>
              <td style={styles.tableCell}>
                <input
                  type="text"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder="Value"
                  style={styles.input}
                />
              </td>
              <td style={styles.tableCell}>
                <div style={styles.actionButtons}>
                  <button 
                    style={{...styles.smallButton, ...styles.saveButton}}
                    onClick={handleAddVariable}>
                    Add
                  </button>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
      
      {/* Toggle edit mode button */}
      <div style={{ marginTop: '1rem' }}>
        <button 
          style={editMode ? {...styles.button, ...styles.cancelButton} : styles.button}
          onClick={() => setEditMode(!editMode)}>
          {editMode ? "Cancel Editing" : "Edit Variables"}
        </button>
      </div>
    </div>
  );
}

export default VariablesTable;