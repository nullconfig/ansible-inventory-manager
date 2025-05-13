// src/App.js
import React, { useState, useEffect } from 'react';
import { ErrorDisplay, VariablesTable } from './components';
import { Icon } from './components/Icon';

function App() {
  console.log("App component rendering");
  const [inventoryData, setInventoryData] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedNodes, setExpandedNodes] = useState({});

  // Fetch inventory data when component mounts
  useEffect(() => {
    console.log("useEffect running, fetching data");

    const fetchData = async () => {
      try {
        if (window.CONFIG.DEBUG_MODE) {
          console.log("Fetching from API endpoint:", window.CONFIG.API_ENDPOINT);
        }

        const response = await fetch(`${window.CONFIG.API_ENDPOINT}/inventory`);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        if (window.CONFIG.DEBUG_MODE) {
          console.log("Fetched data:", data);
        }

        setInventoryData(data);
        setLoading(false);

        // Expand nodes if configured to do so by default
        if (window.CONFIG.DEFAULT_EXPANDED && data && data.groups) {
          const expandedState = {};
          data.groups.forEach(group => {
            expandedState[group._id] = true;
          });
          setExpandedNodes(expandedState);
        }
      } catch (err) {
        console.error("Error fetching inventory:", err);
        setError(`Failed to fetch inventory data: ${err.message}. Please check that the backend service is running and MongoDB is accessible.`);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Toggle expanded state of a node
  const toggleExpand = (id) => {
    setExpandedNodes(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Helper function for demo editing capability
  const handleEdit = () => {
    if (window.CONFIG.DEBUG_MODE) {
      console.log("Edit clicked for item:", selectedItem);
    }
    alert("Edit functionality would be implemented here");
  };

  // Helper function for demo deletion capability
  const handleDelete = () => {
    if (window.CONFIG.DEBUG_MODE) {
      console.log("Delete clicked for item:", selectedItem);
    }
    if (confirm(`Are you sure you want to delete ${selectedItem.name}?`)) {
      alert("Delete functionality would be implemented here");
    }
  };

  // Recursive function to build the tree view
  const renderTreeNode = (item, hostVars, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const hasHosts = item.hosts && item.hosts.length > 0;
    const isExpanded = expandedNodes[item._id];
    const isSelected = selectedItem && selectedItem._id === item._id;

    // Calculate padding based on level
    const paddingLeft = `${level * 16 + 8}px`;

    return (
      <div key={item._id} className="flex flex-col">
        <div
          className={`flex items-center p-2 cursor-pointer ${isSelected ? 'bg-selected' : ''}`}
          style={{ paddingLeft }}
          onClick={() => setSelectedItem({...item, hostVars: hostVars})}
        >
          {(hasChildren || hasHosts) ? (
            <div
              className="mr-1 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(item._id);
              }}
            >
              {isExpanded ? <Icon name="CHEVRON_DOWN" /> : <Icon name="CHEVRON_RIGHT" />}
            </div>
          ) : (
            <div className="w-4 mr-1"></div>
          )}

          {!item.type || item.type === 'group' ?
            <Icon name="FOLDER" /> :
            <Icon name="SERVER" />}

          <span className="ml-2">{item.name}</span>
        </div>

        {isExpanded && (
          <div className="ml-2">
            {/* Render child groups first */}
            {hasChildren && item.children.map(childId => {
              // Find the child group by ID
              const childGroup = inventoryData.groups.find(g => g._id === childId);
              if (childGroup) {
                return renderTreeNode(childGroup, hostVars, level + 1);
              }
              return null;
            })}

            {/* Then render hosts */}
            {hasHosts && item.hosts.map(hostId => {
              const hostData = {
                _id: hostId,
                name: hostId,
                type: 'host',
                vars: hostVars[hostId] || {}
              };
              return renderTreeNode(hostData, hostVars, level + 1);
            })}
          </div>
        )}
      </div>
    );
  };

  // Render item details in the right panel
  const renderItemDetails = (item) => {
    if (!item) return null;

    // Check if it's a host or a group
    const isHost = item.type === 'host';

    return (
      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-xl font-bold mb-4">{item.name}</h2>

        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Basic Information</h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="text-secondary">Type:</div>
            <div>{isHost ? 'Host' : 'Group'}</div>
            <div className="text-secondary">ID:</div>
            <div>{item._id}</div>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Variables</h3>
          <VariablesTable
            variables={item.vars}
            itemId={item._id}
            itemType={isHost ? 'host' : 'group'}
          />
        </div>

        {!isHost && item.children && item.children.length > 0 && (
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Child Groups</h3>
            <ul className="list-disc pl-5">
              {item.children.map(childId => {
                // Find the actual child group object
                const childGroup = inventoryData.groups.find(g => g._id === childId);
                return (
                  <li key={childId}
                      className="text-primary underline cursor-pointer"
                      onClick={() => setSelectedItem({...childGroup, hostVars: item.hostVars})}>
                    {childGroup ? childGroup.name : childId}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {!isHost && item.hosts && item.hosts.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Hosts</h3>
            <ul className="list-disc pl-5">
              {item.hosts.map(hostId => {
                const hostVars = item.hostVars ? item.hostVars[hostId] : {};
                return (
                  <li key={hostId}
                      className="text-primary underline cursor-pointer"
                      onClick={() => setSelectedItem({
                        _id: hostId,
                        name: hostId,
                        type: 'host',
                        vars: hostVars
                      })}>
                    {hostId}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Edit controls - only shown if enabled in config */}
        <div className={`mt-4 gap-2 ${window.CONFIG.ENABLE_EDIT ? 'flex' : 'hidden'}`}>
          <button
            className="bg-primary text-white py-2 px-4 rounded"
            onClick={handleEdit}>
            Edit
          </button>
          <button
            className="bg-red-600 text-white py-2 px-4 rounded"
            onClick={handleDelete}>
            Delete
          </button>
        </div>
      </div>
    );
  };

  // UI for creating new items - only shown if enabled in config
  const renderCreateUI = () => {
    if (!window.CONFIG.ENABLE_CREATE) return null;

    return (
      <div className="mb-4">
        <button
          className="bg-primary text-white py-2 px-4 rounded"
          onClick={() => alert("Create functionality would be implemented here")}>
          + Create New
        </button>
      </div>
    );
  };

  // Loading state
  if (loading) {
    return <div className="flex items-center justify-center h-screen">
      Loading inventory data...
    </div>;
  }

  // Error state
  if (error) {
    return <ErrorDisplay error={error} />;
  }

  // Main layout
  return (
    <div className="flex h-screen bg-background">
      {/* Left sidebar with tree view */}
      <div className="w-1/3 border-r border-border overflow-auto p-4">
        <h1 className="text-xl font-bold mb-4">Ansible Inventory</h1>
        {renderCreateUI()}
        <div className="bg-white rounded shadow">
          {inventoryData && inventoryData.groups &&
            // Find top-level groups (no parent groups)
            inventoryData.groups
              .filter(group => !inventoryData.groups.some(g =>
                g.children && g.children.includes(group._id)
              ))
              .map(item => renderTreeNode(item, inventoryData.hostVars))
          }
        </div>
      </div>

      {/* Right panel with details */}
      <div className="w-2/3 p-4 overflow-auto">
        {selectedItem ? (
          renderItemDetails(selectedItem)
        ) : (
          <div className="flex items-center justify-center h-full text-secondary">
            Select an item from the inventory to view details
          </div>
        )}
      </div>
    </div>
  );
}

export default App;