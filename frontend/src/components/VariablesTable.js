// src/components/VariablesTable.js
import React, { useState, useEffect } from 'react';

export const VariablesTable = ({ variables, itemId, itemType }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newVarName, setNewVarName] = useState('');
  const [newVarValue, setNewVarValue] = useState('');
  const [editingKey, setEditingKey] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [varsData, setVarsData] = useState({...variables || {}});

  useEffect(() => {
    setVarsData({...variables || {}});
  }, [variables]);

  // Helper to parse various data types appropriately
  const parseValue = (value) => {
    if (isNaN(value) || value.trim() === '') {
      return value.toLowerCase() === 'true' || value.toLowerCase() !== 'false' && value;
    }
    return Number(value);
  };

  // Helper to format values for display
  const formatValue = (val) => {
    return typeof val === 'object' ? JSON.stringify(val) : String(val);
  };

  // Save variables to backend
  const saveVariables = async (id, type, vars) => {
    try {
      let apiBase = window.CONFIG.API_ENDPOINT;
      
      if (apiBase.endsWith('/inventory')) {
        apiBase = apiBase.substring(0, apiBase.length - 10);
      }
      
      const endpoint = type === 'host' 
        ? `${apiBase}/inventory/hosts/${id}/vars` 
        : `${apiBase}/inventory/groups/${id}/vars`;
      
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(vars)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update variables: ${response.statusText}`);
      }
      
    } catch (err) {
      console.error("Error saving variables:", err);
      alert(`Failed to save changes: ${err.message}\nCheck browser console for details.`);
    }
  };

  // Save an edited variable
  const saveEdit = (key) => {
    const updatedVars = {...varsData, [key]: parseValue(editValue)};
    setVarsData(updatedVars);
    saveVariables(itemId, itemType, updatedVars);
    setEditingKey(null);
  };

  // Delete a variable
  const deleteVariable = (key) => {
    if (confirm(`Are you sure you want to delete the variable "${key}"?`)) {
      const updatedVars = {...varsData};
      delete updatedVars[key];
      setVarsData(updatedVars);
      saveVariables(itemId, itemType, updatedVars);
    }
  };

  // Add a new variable
  const addVariable = () => {
    if (newVarName.trim()) {
      const updatedVars = {
        ...varsData,
        [newVarName]: parseValue(newVarValue)
      };
      setVarsData(updatedVars);
      saveVariables(itemId, itemType, updatedVars);
      setNewVarName('');
      setNewVarValue('');
    }
  };

  // If no variables and not editing, show empty state
  if (!varsData || (Object.keys(varsData).length === 0 && !isEditing)) {
    return (
      <div>
        <div className="italic text-secondary dark:text-gray-400">No variables defined</div>
        <div className="mt-4">
          <button
            className="bg-primary text-white py-2 px-4 rounded dark:bg-primary-dark"
            onClick={() => setIsEditing(true)}>
            Add Variable
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="text-left p-2 bg-table-header dark:bg-table-header-dark border border-border dark:border-border-dark dark:text-gray-200">Variable</th>
            <th className="text-left p-2 bg-table-header dark:bg-table-header-dark border border-border dark:border-border-dark dark:text-gray-200">Value</th>
            {isEditing && <th className="text-left p-2 bg-table-header dark:bg-table-header-dark border border-border dark:border-border-dark dark:text-gray-200">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {Object.entries(varsData).map(([key, value]) => (
            <tr key={key}>
              <td className="p-2 border border-border dark:border-border-dark font-mono text-sm dark:text-gray-300">
                {editingKey === key ? (
                  <div className="flex items-center justify-between">
                    <span>{key}</span>
                  </div>
                ) : key}
              </td>
              <td className="p-2 border border-border dark:border-border-dark font-mono text-sm dark:text-gray-300">
                {editingKey === key ? (
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-full p-1.5 border border-border dark:border-border-dark rounded dark:bg-gray-700 dark:text-gray-200"
                  />
                ) : formatValue(value)}
              </td>
              {isEditing && (
                <td className="p-2 border border-border dark:border-border-dark">
                  {editingKey === key ? (
                    <div className="flex justify-start gap-1">
                      <button
                        className="bg-green-600 text-white py-1 px-2 rounded text-xs dark:bg-green-700"
                        onClick={() => saveEdit(key)}>
                        Save
                      </button>
                      <button
                        className="bg-gray-500 text-white py-1 px-2 rounded text-xs dark:bg-gray-600"
                        onClick={() => setEditingKey(null)}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-start gap-1">
                      <button
                        className="bg-primary text-white py-1 px-2 rounded text-xs dark:bg-primary-dark"
                        onClick={() => {
                          setEditingKey(key);
                          setEditValue(formatValue(value));
                        }}>
                        Edit
                      </button>
                      <button
                        className="bg-red-600 text-white py-1 px-2 rounded text-xs dark:bg-red-700"
                        onClick={() => deleteVariable(key)}>
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              )}
            </tr>
          ))}
          {isEditing && (
            <tr>
              <td className="p-2 border border-border dark:border-border-dark">
                <input
                  type="text"
                  value={newVarName}
                  onChange={(e) => setNewVarName(e.target.value)}
                  placeholder="New variable name"
                  className="w-full p-1.5 border border-border dark:border-border-dark rounded dark:bg-gray-700 dark:text-gray-200"
                />
              </td>
              <td className="p-2 border border-border dark:border-border-dark">
                <input
                  type="text"
                  value={newVarValue}
                  onChange={(e) => setNewVarValue(e.target.value)}
                  placeholder="Value"
                  className="w-full p-1.5 border border-border dark:border-border-dark rounded dark:bg-gray-700 dark:text-gray-200"
                />
              </td>
              <td className="p-2 border border-border dark:border-border-dark">
                <div className="flex justify-start gap-1">
                  <button
                    className="bg-green-600 text-white py-1 px-2 rounded text-xs dark:bg-green-700"
                    onClick={addVariable}>
                    Add
                  </button>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <div className="mt-4">
        <button
          className={`py-2 px-4 rounded ${isEditing ? 'bg-gray-500 dark:bg-gray-600' : 'bg-primary dark:bg-primary-dark'} text-white`}
          onClick={() => setIsEditing(!isEditing)}>
          {isEditing ? 'Cancel Editing' : 'Edit Variables'}
        </button>
      </div>
    </div>
  );
};