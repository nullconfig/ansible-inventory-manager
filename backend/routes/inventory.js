const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Import inventory model
const Inventory = require('../models/inventory');

/**
 * GET /api/inventory
 * Retrieve the entire inventory structure
 */
router.get('/', async (req, res, next) => {
  try {
    // Get all groups
    const groups = await Inventory.Group.find({}).lean();
    
    // Get all host variables
    const hostVars = await Inventory.Host.find({}).lean();
    
    // Transform host variables to the format expected by the frontend
    const hostVarsObj = {};
    hostVars.forEach(host => {
      hostVarsObj[host.name] = host.vars;
    });
    
    res.json({
      groups: groups,
      hostVars: hostVarsObj
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/inventory/groups
 * Get all groups
 */
router.get('/groups', async (req, res, next) => {
  try {
    const groups = await Inventory.Group.find({}).lean();
    res.json(groups);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/inventory/groups/:id
 * Get a specific group by ID
 */
router.get('/groups/:id', async (req, res, next) => {
  try {
    const group = await Inventory.Group.findById(req.params.id).lean();
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    res.json(group);
  } catch (err) {
    // Handle invalid ObjectId
    if (err instanceof mongoose.Error.CastError) {
      return res.status(400).json({ error: 'Invalid group ID format' });
    }
    next(err);
  }
});

// Enhanced PUT route handler for group variables with better logging and error handling
router.put('/groups/:id/vars', async (req, res, next) => {
  try {
    const groupId = req.params.id;
    const updatedVars = req.body;
    
    console.log(`Attempting to update variables for group: ${groupId}`);
    console.log('Received data:', JSON.stringify(updatedVars, null, 2));
    
    // Input validation
    if (!updatedVars || typeof updatedVars !== 'object') {
      console.error('Invalid variables format:', updatedVars);
      return res.status(400).json({ error: 'Invalid variables format' });
    }
    
    // Find and update the group
    console.log('Executing findByIdAndUpdate operation...');
    const updateResult = await Inventory.Group.findByIdAndUpdate(
      groupId,
      { vars: updatedVars },
      { 
        new: true, // Return the updated document
        upsert: false // Don't create if it doesn't exist
      }
    ).lean();
    
    console.log('MongoDB update result:', updateResult ? 'Success' : 'Not found');
    
    if (!updateResult) {
      console.error(`Group ${groupId} not found`);
      return res.status(404).json({ 
        error: 'Group not found',
        message: `No group with ID ${groupId} exists in the database` 
      });
    }
    
    console.log('Group update successful');
    res.json({ 
      success: true, 
      vars: updateResult.vars,
      message: 'Group variables updated'
    });
  } catch (err) {
    console.error('Error in updateGroupVars:', err);
    console.error('Stack trace:', err.stack);
    
    // Handle invalid ObjectId format
    if (err instanceof mongoose.Error.CastError) {
      return res.status(400).json({ 
        error: 'Invalid group ID format',
        details: err.message 
      });
    }
    
    next(err);
  }
});

/**
 * GET /api/inventory/hosts
 * Get all hosts
 */
router.get('/hosts', async (req, res, next) => {
  try {
    const hosts = await Inventory.Host.find({}).lean();
    res.json(hosts);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/inventory/hosts/:name
 * Get a specific host by name
 */
router.get('/hosts/:name', async (req, res, next) => {
  try {
    const host = await Inventory.Host.findOne({ name: req.params.name }).lean();
    if (!host) {
      return res.status(404).json({ error: 'Host not found' });
    }
    res.json(host);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/inventory/hosts/:name/vars
 * Update variables for a specific host, ensuring _id matches hostname
 */
router.put('/hosts/:name/vars', async (req, res, next) => {
  try {
    const hostName = req.params.name;
    const updatedVars = req.body;
    
    console.log(`Attempting to update variables for host: ${hostName}`);
    console.log('Received data:', JSON.stringify(updatedVars, null, 2));
    
    // Input validation
    if (!updatedVars || typeof updatedVars !== 'object') {
      console.error('Invalid variables format:', updatedVars);
      return res.status(400).json({ error: 'Invalid variables format' });
    }
    
    // IMPORTANT: First, check if the host exists by name
    console.log(`Looking for existing host with name: ${hostName}`);
    const existingHost = await Inventory.Host.findOne({ name: hostName }).lean();
    
    if (existingHost) {
      console.log(`Found existing host: ${existingHost._id}`);
      console.log('Existing host document:', existingHost);
      
      // Update the existing host
      console.log(`Updating variables for existing host: ${hostName}`);
      const updateResult = await Inventory.Host.findOneAndUpdate(
        { name: hostName },
        { vars: updatedVars },
        { new: true }
      ).lean();
      
      console.log('Update result:', updateResult);
      
      return res.json({
        success: true,
        vars: updateResult.vars,
        message: 'Host variables updated',
        host: hostName,
        id: updateResult._id
      });
    } else {
      // Host doesn't exist, create a new one with _id = name
      console.log(`Host ${hostName} not found, creating new host with _id = name`);
      
      const newHost = new Inventory.Host({
        _id: hostName,  // Set _id to be the same as name
        name: hostName,
        vars: updatedVars
      });

      console.log('Creating new host document:', newHost);
      await newHost.save();
      console.log('New host document created successfully');
      
      return res.status(201).json({
        success: true,
        vars: updatedVars,
        message: 'New host created',
        host: hostName,
        id: hostName
      });
    }
  } catch (err) {
    console.error('Error in updateHostVars:', err);
    console.error('Stack trace:', err.stack);
    
    // Specific error handling for different MongoDB errors
    if (err.name === 'MongoServerError') {
      if (err.code === 11000) {
        return res.status(409).json({ 
          error: 'Duplicate key error', 
          details: err.message 
        });
      }
    }
    
    next(err);
  }
});

/**
 * Function to ensure all hosts in groups exist in the hosts collection
 * This should be called when loading inventory data
 */
async function ensureHostsExist() {
  try {
    console.log('Ensuring all hosts referenced in groups exist in hosts collection...');
    
    // Get all groups
    const groups = await Inventory.Group.find({}).lean();
    
    // Collect all unique host names from all groups, filtering out empty values
    const referencedHosts = new Set();
    for (const group of groups) {
      if (group.hosts && Array.isArray(group.hosts)) {
        group.hosts.forEach(host => {
          // Only add non-empty host names
          if (host && typeof host === 'string' && host.trim() !== '') {
            referencedHosts.add(host.trim());
          }
        });
      }
    }
    
    console.log(`Found ${referencedHosts.size} unique hosts referenced in groups`);
    
    // Check which hosts already exist in the database
    const existingHosts = await Inventory.Host.find({
      name: { $in: Array.from(referencedHosts) }
    }).lean();
    
    const existingHostNames = new Set(existingHosts.map(h => h.name));
    console.log(`Found ${existingHostNames.size} hosts that already exist in the database`);
    
    // Create hosts that don't yet exist
    const hostsToCreate = Array.from(referencedHosts)
      .filter(hostname => !existingHostNames.has(hostname));
    
    if (hostsToCreate.length > 0) {
      console.log(`Creating ${hostsToCreate.length} new hosts`);
      
      const hostDocs = hostsToCreate.map(hostname => {
        // Double-check hostname is valid before creating document
        if (!hostname || typeof hostname !== 'string' || hostname.trim() === '') {
          console.warn(`Skipping invalid host name: '${hostname}'`);
          return null;
        }
        return {
          _id: hostname,
          name: hostname,
          vars: {}
        };
      }).filter(doc => doc !== null); // Remove any null entries
      
      if (hostDocs.length > 0) {
        await Inventory.Host.insertMany(hostDocs);
        console.log('Successfully created missing hosts');
      } else {
        console.log('No valid host documents to create');
      }
    } else {
      console.log('All referenced hosts already exist');
    }
    
    return {
      total: referencedHosts.size,
      existing: existingHostNames.size,
      created: hostsToCreate.length
    };
  } catch (error) {
    console.error('Error ensuring hosts exist:', error);
    throw error;
  }
}

/**
 * GET /api/inventory
 * Retrieve the entire inventory structure and ensure hosts exist
 */
router.get('/', async (req, res, next) => {
  try {
    // First ensure all hosts referenced in groups exist
    await ensureHostsExist();
    
    // Get all groups
    const groups = await Inventory.Group.find({}).lean();
    
    // Get all host variables
    const hostVars = await Inventory.Host.find({}).lean();
    
    // Transform host variables to the format expected by the frontend
    const hostVarsObj = {};
    hostVars.forEach(host => {
      hostVarsObj[host.name] = host.vars;
    });
    
    res.json({
      groups: groups,
      hostVars: hostVarsObj
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/inventory/groups
 * Create or update a group and ensure all hosts exist
 */
router.post('/groups', async (req, res, next) => {
  try {
    const groupData = req.body;
    
    // Ensure ID matches name
    if (!groupData._id) {
      groupData._id = groupData.name;
    } else if (!groupData.name) {
      groupData.name = groupData._id;
    }
    
    console.log(`Creating/updating group: ${groupData.name}`);
    
    // Create or update the group
    const result = await Inventory.Group.findByIdAndUpdate(
      groupData._id,
      groupData,
      { new: true, upsert: true }
    );
    
    // Ensure all hosts in this group exist
    if (groupData.hosts && Array.isArray(groupData.hosts) && groupData.hosts.length > 0) {
      console.log(`Ensuring ${groupData.hosts.length} hosts in group ${groupData.name} exist`);
      
      // Get existing hosts
      const existingHosts = await Inventory.Host.find({
        name: { $in: groupData.hosts }
      }).lean();
      
      const existingHostNames = new Set(existingHosts.map(h => h.name));
      
      // Create hosts that don't exist
      const hostsToCreate = groupData.hosts
        .filter(hostname => !existingHostNames.has(hostname))
        .map(hostname => ({
          _id: hostname,
          name: hostname,
          vars: {}
        }));
      
      if (hostsToCreate.length > 0) {
        console.log(`Creating ${hostsToCreate.length} new hosts from group ${groupData.name}`);
        await Inventory.Host.insertMany(hostsToCreate);
      }
    }
    
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/inventory/groups/:id/hosts
 * Update hosts in a group and ensure they exist
 */
router.put('/groups/:id/hosts', async (req, res, next) => {
  try {
    const groupId = req.params.id;
    const hosts = req.body.hosts;
    
    if (!Array.isArray(hosts)) {
      return res.status(400).json({ error: 'Hosts must be an array' });
    }
    
    console.log(`Updating hosts for group ${groupId}: ${hosts.join(', ')}`);
    
    // Update the group's hosts
    const updateResult = await Inventory.Group.findByIdAndUpdate(
      groupId,
      { hosts: hosts },
      { new: true }
    );
    
    if (!updateResult) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    // Ensure all new hosts exist in the database
    const existingHosts = await Inventory.Host.find({
      name: { $in: hosts }
    }).lean();
    
    const existingHostNames = new Set(existingHosts.map(h => h.name));
    
    // Create hosts that don't exist
    const hostsToCreate = hosts
      .filter(hostname => !existingHostNames.has(hostname))
      .map(hostname => ({
        _id: hostname,
        name: hostname,
        vars: {}
      }));
    
    if (hostsToCreate.length > 0) {
      console.log(`Creating ${hostsToCreate.length} new hosts`);
      await Inventory.Host.insertMany(hostsToCreate);
    }
    
    res.json({
      success: true,
      group: updateResult,
      hostsCreated: hostsToCreate.length
    });
  } catch (err) {
    next(err);
  }
});

// Attach the function to the router object
router.ensureHostsExist = ensureHostsExist;

// Export the router
module.exports = router;