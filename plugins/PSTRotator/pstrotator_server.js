////////////////////////////////////////////////////////////////////
//                                                                //
//  PST ROTATOR SERVER SCRIPT FOR FM-DX-WEBSERVER (V3.0)         //
//                                                                //
//  by Highpoint                        last update: 29.11.25     //
//                                                                //
//  https://github.com/Highpoint2000/PSTRotator                   //
//                                                                //
////////////////////////////////////////////////////////////////////

const path = require('path');
const fs = require('fs');
const { logInfo, logError } = require('./../../server/console');

// Define source and target paths for rotor.png
const sourceImagePath = path.join(__dirname, 'rotor.png');
const targetImagePath = path.join(__dirname, './../../web/images/rotor.png');

/**
 * Copies rotor.png to the target directory if it does not already exist.
 */
function copyRotorImage() {
    // Check if the target directory exists; if not, create it
    const targetDir = path.dirname(targetImagePath);
    if (!fs.existsSync(targetDir)) {
        try {
            fs.mkdirSync(targetDir, { recursive: true });
            // logInfo(`Created target directory: ${targetDir}`);
        } catch (err) {
            logError(`Failed to create target directory ${targetDir}:`, err);
            return;
        }
    }

    // Check if rotor.png already exists in the target directory
    if (!fs.existsSync(targetImagePath)) {
        // Check if the source rotor.png exists
        if (fs.existsSync(sourceImagePath)) {
            // Copy rotor.png to the target directory
            fs.copyFile(sourceImagePath, targetImagePath, (err) => {
                if (err) {
                    logError(`Error copying rotor.png to ${targetImagePath}:`, err);
                } else {
                    // logInfo(`rotor.png successfully copied to ${targetImagePath}`);
                }
            });
        } else {
            logError(`Source rotor.png not found at ${sourceImagePath}`);
        }
    } else {
        // logInfo(`rotor.png already exists in ${targetImagePath}`);
    }
}

// Execute the copy at startup
copyRotorImage();

// Define the paths to the old and new configuration files
const oldConfigFilePath = path.join(__dirname, 'configPlugin.json');
const newConfigFilePath = path.join(__dirname, './../../plugins_configs/pstrotator.json');

/**
 * Default values for the configuration file. 
 * Do not enter these values manually!!!
 * Save your configuration in pstrotator.json, which is automatically created on first run.
 */
const defaultConfig = {
    PSTRotatorUrl: 'http://127.0.0.1:80',      // Base URL for the PST Rotator software
    port: 3000,                                // Port for the internal CORS Proxy (default: 3000)
    RotorLimitLineLength: 0,                   // Set the length of the line (default: 67, none: 0)
    RotorLimitLineAngle: 129,                  // Set the angle of the line (e.g., 180)
    RotorLimitLineColor: '#808080',            // Set the color for the additional line (default: #808080)
    lockStartTime: '',                         // Start time for locking in HH:MM format (empty => no locking / 00:00 => 24h lock)
    lockEndTime: '',                           // End time for locking in HH:MM format (empty => no locking / 00:00 => 24h lock)
	ESfollowOnStart: false,					   // Set true or false for automatic start ES follow mode
	LAST_ALERT_MINUTES: 15,			   	       // Enter the time in minutes for processing the last message when starts the server (default is 15)
	FMLIST_OMID:''							   // Set your OMID to use the ES follow mode
	};

/**
 * Merges default configuration with an existing configuration, removing undefined values.
 * 
 * @param {Object} defaultConfig - The default configuration object.
 * @param {Object} existingConfig - The existing configuration object.
 * @returns {Object} - The merged configuration.
 */
function mergeConfig(defaultConfig, existingConfig) {
    const updatedConfig = {};

    // Add existing values that match defaultConfig keys
    for (const key in defaultConfig) {
        // If existingConfig has the key, use it; otherwise, use default
        updatedConfig[key] = key in existingConfig ? existingConfig[key] : defaultConfig[key];
    }
    return updatedConfig;
}

/**
 * Loads the old config file, moves it to the new location, and deletes the old one.
 * 
 * @param {string} oldFilePath - Path to the old configuration file.
 * @param {string} newFilePath - Path to the new configuration file.
 * @returns {Object|null} - The old configuration object if it existed, otherwise null.
 */
function migrateOldConfig(oldFilePath, newFilePath) {
    if (fs.existsSync(oldFilePath)) {
        // Load the old config
        const oldConfig = JSON.parse(fs.readFileSync(oldFilePath, 'utf-8'));
        
        // Save the old config to the new location
        fs.writeFileSync(newFilePath, JSON.stringify(oldConfig, null, 2), 'utf-8');
        logInfo(`Old config migrated to ${newFilePath}`);

        // Delete the old config file
        fs.unlinkSync(oldFilePath);
        logInfo(`Old config ${oldFilePath} deleted`);
        
        return oldConfig;
    }

    return null;  // No old config found
}

/**
 * Loads or creates the configuration file, merging with defaults if needed.
 * 
 * @param {string} filePath - Path to the new configuration file (pstrotator.json).
 * @returns {Object} - The final configuration object.
 */
function loadConfig(filePath) {
    let existingConfig = {};

    // Try to migrate the old config if it exists
    const migratedConfig = migrateOldConfig(oldConfigFilePath, filePath);
    if (migratedConfig) {
        existingConfig = migratedConfig;
    } else {
        // Check if the new config file exists
        if (fs.existsSync(filePath)) {
            // Read the existing configuration file
            existingConfig = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        } else {
            logInfo('PST Rotator configuration not found. Creating pstrotator.json.');
        }
    }

    // Merge the default config with the existing one, adding missing fields
    const finalConfig = mergeConfig(defaultConfig, existingConfig);

    // Write the updated configuration back to the file
    fs.writeFileSync(filePath, JSON.stringify(finalConfig, null, 2), 'utf-8');

    return finalConfig;
}

// Load or create the configuration file
const configPlugin = loadConfig(newConfigFilePath);

// Access to the variables
const PSTRotatorUrl = configPlugin.PSTRotatorUrl;
const port = configPlugin.port;
const RotorLimitLineLength = configPlugin.RotorLimitLineLength;
const RotorLimitLineAngle = configPlugin.RotorLimitLineAngle;
const RotorLimitLineColor = configPlugin.RotorLimitLineColor;
const lockStartTime = configPlugin.lockStartTime;
const lockEndTime = configPlugin.lockEndTime;
const ESfollowOnStart = configPlugin.ESfollowOnStart;
const LAST_ALERT_MINUTES = configPlugin.LAST_ALERT_MINUTES;
const FMLIST_OMID = configPlugin.FMLIST_OMID;

// Log configured lock times on startup
if (lockStartTime && lockEndTime) {
    logInfo(`Rotor lock schedule configured: ${lockStartTime} - ${lockEndTime} (Server Time)`);
} else {
    logInfo(`Rotor lock schedule not configured (always unlocked unless manual override)`);
}

// Initialize OnlyViewModus based on time-controlled locking
// OnlyViewModus tracks the SCHEDULED state (true=should be locked, false=should be unlocked)
// Initializing to null allows us to detect the first "change" on startup.
let OnlyViewModus = null; 
let LockValue = true;      // Initial declaration of actual lock state
let lock = true;
let follow = false;

if (ESfollowOnStart && FMLIST_OMID !== '') {
	LockValue = true; 
	// We don't force OnlyViewModus here to avoid conflicting with time check
    // Time check will set OnlyViewModus correctly on first run.
	follow = true;
	logInfo('Rotor set ES follow mode true');
}
	
// Global variable for throttling: Only one message is processed within 500 ms
let lastMessageTimestamp = 0;
let lastMessageTimestampTurning = 0;
let lastEsTimestamp = 0;
let esFollowIntervalId = null;

// Path to the target JavaScript file
const PSTrotatorClientFile = path.join(__dirname, 'pstrotator.js');

/**
 * Updates or inserts specific configuration settings (RotorLimitLineLength, RotorLimitLineAngle, RotorLimitLineColor)
 * into the pstrotator.js file.
 */
function updateSettings() {
  // Read the target file
  fs.readFile(PSTrotatorClientFile, 'utf8', (err, targetData) => {
    if (err) {
      logError('Error reading pstrotator.js:', err);
      return;
    }

    // Check if the variables already exist
    let hasRotorLimitLineLength = /const RotorLimitLineLength = .+;/.test(targetData);
    let hasRotorLimitLineAngle = /const RotorLimitLineAngle = .+;/.test(targetData);
    let hasRotorLimitLineColor = /const RotorLimitLineColor = .+;/.test(targetData);

    // Replace or add the definitions
    let updatedData = targetData;

    if (hasRotorLimitLineLength) {
      updatedData = updatedData.replace(
        /const RotorLimitLineLength = .*;/,
        `const RotorLimitLineLength = ${RotorLimitLineLength};`
      );
    } else {
      updatedData = `const RotorLimitLineLength = ${RotorLimitLineLength};\n` + updatedData;
    }

    if (hasRotorLimitLineAngle) {
      updatedData = updatedData.replace(
        /const RotorLimitLineAngle = .*;/,
        `const RotorLimitLineAngle = ${RotorLimitLineAngle};`
      );
    } else {
      updatedData = `const RotorLimitLineAngle = ${RotorLimitLineAngle};\n` + updatedData;
    }
    
    if (hasRotorLimitLineColor) {
      updatedData = updatedData.replace(
        /const RotorLimitLineColor = .*;/,
        `const RotorLimitLineColor = '${RotorLimitLineColor}';`
      );
    } else {
      updatedData = `const RotorLimitLineColor = '${RotorLimitLineColor}';\n` + updatedData;
    }

    // Update the target file
    fs.writeFile(PSTrotatorClientFile, updatedData, 'utf8', (err) => {
      if (err) {
        logError('Error writing to pstrotator.js:', err);
        return;
      }
      logInfo('pstrotator.js has been successfully updated');
    });
  });
}

// Call the updateSettings function
updateSettings();

// Load port configuration from config.json
const config = require('./../../config.json');
const webserverPort = config.webserver.webserverPort || 8080; // Use the port from config.json or default to 8080
const externalWsUrl = `ws://127.0.0.1:${webserverPort}/data_plugins`;

// Function to check and install missing modules (NewModules)
const { execSync } = require('child_process');
const NewModules = [
    { name: 'jsdom', version: '16.7.0' }
];

/**
 * Checks if specific modules are installed. If not, installs them automatically.
 */
function checkAndInstallNewModules() {
    NewModules.forEach(mod => {
        const moduleName = mod.name;
        const moduleVersion = mod.version;
        const modulePath = path.join(__dirname, './../../node_modules', moduleName);
        
        let installNeeded = false;

        if (!fs.existsSync(modulePath)) {
            console.log(`Module ${moduleName} is missing.`);
            installNeeded = true;
        } else {
            // Check installed version
            try {
                const pkg = require(path.join(modulePath, 'package.json'));
                if (pkg.version !== moduleVersion) {
                    console.log(`Module ${moduleName} version mismatch (Found: ${pkg.version}, Required: ${moduleVersion}).`);
                    installNeeded = true;
                }
            } catch (e) {
                console.log(`Error reading ${moduleName} package.json.`);
                installNeeded = true;
            }
        }

        if (installNeeded) {
             console.log(`Installing ${moduleName}@${moduleVersion}...`);
            try {
                execSync(`npm install ${moduleName}@${moduleVersion} --save`, { stdio: 'inherit' });
                console.log(`Module ${moduleName} installed successfully.`);
            } catch (error) {
                logError(`Error installing module ${moduleName}:`, error);
                process.exit(1); // Exit the process with an error code
            }
        }
    });
}

// Check and install missing modules before starting the server
checkAndInstallNewModules();

// Import necessary modules
const express = require('express');  // For creating the HTTP server
const fetch = require('node-fetch'); // For making HTTP requests
const { JSDOM } = require('jsdom');  // For parsing and manipulating HTML
const WebSocket = require('ws');     // For WebSocket communication
const app = express();               // Initialize the Express application

// Middleware for CORS (Cross-Origin Resource Sharing)
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');   // Allow requests from any origin
    res.setHeader('Access-Control-Allow-Methods', 'GET');  // Allow only GET requests
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type'); // Allow Content-Type header
    next(); // Proceed to the next middleware or route handler
});

/**
 * Route to act as a proxy for fetching data from other URLs.
 * Example: /proxy?url=http://example.com
 */
app.get('/proxy', async (req, res) => {
    const targetUrl = req.query.url; // Get the target URL from query parameters
    if (!targetUrl) {
        return res.status(400).send('URL parameter is missing');
    }

    try {
        const response = await fetch(targetUrl); // Fetch data from the target URL
        const body = await response.text();      // Get the response body as text
        res.send(body);                          // Send the body back as the response
    } catch (error) {
        logError('Error fetching the URL: ' + error);
        res.status(500).send('Error fetching the URL');
    }
});

// Initialize global variables
const clientIp = '127.0.0.1'; // Define the client IP address
let lastBearingValue = null;  // Variable to store the last bearing value
let externalWs = null;        // Define externalWs as a global variable

// Start the HTTP server and listen on the specified port
const server = app.listen(port, () => {
    logInfo(`Rotor Proxy server is running at http://localhost:${port}`);

    // Start the server and delay WebSocket initialization
    setTimeout(() => {
        initializeWebSockets(); // Initialize WebSocket connections after a delay
        checkWebsiteAvailability().then(isAvailable => {
            if (isAvailable) {
                setInterval(fetchAndProcessData, 500); // Poll every 500 milliseconds
            } else {
                logError('Polling loop will not start because PST Rotator web server is not reachable.');
            }
        });
    }, 1000); // Delay of 1000 ms

    // Initialize the lock based on the current time
    checkAndUpdateLock(false); // No broadcast on initial start

    // Schedule the lock check to run every minute
    setInterval(() => {
        checkAndUpdateLock(true); // Pass true to allow broadcasts on status change
    }, 60 * 1000);
});

/**
 * Initializes WebSocket connections for both the incoming server and outgoing external WebSocket.
 */
function initializeWebSockets() {
   
    // Create a WebSocket client for sending data to the external server
    externalWs = new WebSocket(externalWsUrl);
    externalWs.on('open', () => {
        logInfo(`Rotor connected to external WebSocket server at ${externalWsUrl}`);
    });

    externalWs.on('message', message => {
	
        try {
            const messageObject = JSON.parse(message);
            // Debug log for only 'Rotor' messages to avoid noise
            if (messageObject.source !== '127.0.0.1' && messageObject.type === 'Rotor') {
                logInfo(`RX: type=${messageObject.type}, value=${messageObject.value}, source=${messageObject.source}`);
            }

            const auth = messageObject._auth || {};
            const isAdmin = auth.admin === true;
            const isTune = auth.tune === true;

            // Detect a pure "request" message
            if (messageObject.type === 'Rotor' && messageObject.value === 'request' && messageObject.source !== '127.0.0.1') {
				
				logInfo(`Rotor request from ${messageObject.source} processing...`);
				
                // Recalculate/Verify current lock state based on time logic
                // IMPORTANT: This updates OnlyViewModus but DOES NOT override manual LockValue
                // unless a schedule boundary was crossed just now.
                checkAndUpdateLock(false); 
			
                const responseMessage = JSON.stringify({
                    type: 'Rotor',
                    value: lastBearingValue || 'No bearing data available',
                    lock: LockValue,
					follow: follow,
                    source: clientIp,
                    clientId: messageObject.clientId // Echo clientId back
                });
                externalWs.send(responseMessage);
				
				logInfo(`Rotor responded to ${messageObject.source}: bearing=${lastBearingValue}, lock=${LockValue}, follow=${follow}`);			

            // Detect a message that is not a "request"
            } else if (
                messageObject.type === 'Rotor' &&
                messageObject.value !== 'request' &&
                messageObject.source !== '127.0.0.1'
            ) {

                // Check if only lock status is being requested
				if ((messageObject.follow === true || messageObject.follow === false) && FMLIST_OMID !== '') {
					
					logInfo(`Rotor received follow request: ${messageObject.follow} from ${messageObject.source}`);
					
                    // Only Admin is allowed to toggle follow mode now (Tune removed)
                    if (isAdmin) {
                        setFollowMode(messageObject.follow);			
				
                        const responseMessage = JSON.stringify({
                            type: 'Rotor',
                            value: lastBearingValue || 'No bearing data available',
                            follow: follow,
                            source: '127.0.0.1'
                        });
                        
                        externalWs.send(responseMessage);					
                        logInfo(`Rotor responded with ${lastBearingValue}° and ES follow ${follow}`);
                    } else {
                        logError(`Rotor detects unauthorized follow request from ${messageObject.source}!`);
                    }
					
				} else if ((messageObject.lock === true || messageObject.lock === false) && !messageObject.value) {
					
					logInfo(`Rotor received lock request: ${messageObject.lock} from ${messageObject.source}`);

					if (isAdmin) {					
                        LockValue = messageObject.lock;
                        // Force update OnlyViewModus to match manual override if necessary, 
                        // or simply respect the manual override until the next time check.
                        
                        const responseMessage = JSON.stringify({
                            type: 'Rotor',
                            lock: LockValue,
                            source: '127.0.0.1'
                        });
                
                        externalWs.send(responseMessage);
                        logInfo(`Rotor responded with lock ${LockValue}`);

                    } else {
                        logError(`Rotor detects unauthorized lock request from ${messageObject.source}!`);
                    }			
				
                // We have a specified angle (bearing)
                } else {		
					if (messageObject.lock === false) {
                        // If client sends lock=false, they think it's unlocked. 
                        // Server state is authority.
					}
                    
                    // If Locked (either manually or by timer)
                    if (LockValue) {
                        // Tune users can now rotate even if locked
                        if (isAdmin || isTune) {
                            // Admin and Tune can always rotate
                            updatePstRotator(messageObject.value);
                            logInfo(`Rotor request to turn to ${messageObject.value}° from ${messageObject.source}`);
                        } else {
                            logError(`Rotor detects unauthorized rotation attempt from ${messageObject.source}!`);
                        }
                    } else {
                        // Unlocked - anyone can rotate
                        updatePstRotator(messageObject.value);
                        logInfo(`Rotor request to turn to ${messageObject.value}° from ${messageObject.source}`);
                    }
                }
            }
        } catch (error) {
            logError('Error processing message from external WebSocket server: ' + error);
        }
    });

    externalWs.on('error', error => {
        logError('Error connecting to external WebSocket server: ' + error);
    });
}

/**
 * Checks whether the PST Rotator web server is available via the proxy.
 * 
 * @returns {Promise<boolean>} - Returns true if the server is reachable, otherwise false.
 */
async function checkWebsiteAvailability() {
    const proxyUrl = `http://127.0.0.1:${port}/proxy?url=${PSTRotatorUrl}/PstRotatorAz.htm`;

    try {
        const response = await fetch(proxyUrl);
        if (response.ok) {
            logInfo(`PST Rotator web server ${PSTRotatorUrl} is reachable through the proxy`);
            return true;
        } else {
            logError(`PST Rotator web server ${PSTRotatorUrl} is not reachable. Status: ${response.status}`);
            return false;
        }
    } catch (error) {
        logError('Error checking PST Rotator web server availability: ' + error);
        return false;
    }
}

/**
 * Fetches and processes data from the PST Rotator web server. 
 * Broadcasts the current bearing to externalWs if it changes.
 */
async function fetchAndProcessData() {
    const proxyUrl = `http://127.0.0.1:${port}/proxy?url=${PSTRotatorUrl}/PstRotatorAz.htm`;

    try {
        const response = await fetch(proxyUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const text = await response.text();

        const { document } = (new JSDOM(text)).window;
        const bearingElement = Array.from(document.querySelectorAll('*'))
            .find(el => el.textContent.includes('Bearing'));

        let bearingValue = 'Bearing value not found.';

        if (bearingElement) {
            const bearingText = bearingElement.textContent;
            const bearingRegex = /Bearing\s*[:=]\s*([^\s<]+)/;
            const match = bearingText.match(bearingRegex);

            if (match) {
                bearingValue = match[1];
            }
        }

        // Broadcast the new bearing value if it has changed
        if (bearingValue !== lastBearingValue) {
            const message = JSON.stringify({ type: 'Rotor', value: bearingValue, follow: follow, source: clientIp });

            if (externalWs && externalWs.readyState === WebSocket.OPEN) {
                externalWs.send(message);
                logInfo(`Rotor broadcast: ${bearingValue}°`);
                lastBearingValue = bearingValue;
            } else {
                logError('External WebSocket connection is not open');
            }
        }

    } catch (error) {
        logError('Error fetching or parsing the page: ' + error);
    }
}

/**
 * Submits a GET request to PST Rotator to update the bearing.
 * 
 * @param {string} value - The bearing value (angle) to which the rotor should turn.
 */
async function updatePstRotator(value) {
    const formActionUrl = `${PSTRotatorUrl}/PstRotatorAz.htm`; // The form action URL
    
    // Construct URL with query parameters
    const url = new URL(formActionUrl);
    url.searchParams.append('az', value);

    try {
        // Fetch the page
        const response = await fetch(url.toString(), {
            method: 'GET'
        });

        if (response.ok) {
		   logInfo(`Rotor is turning to ${value}°`);
        } else {
            logError(`Rotor: form submission failed. Status: ${response.status}`);
        }
    } catch (error) {
        logError('Error updating PST Rotator: ' + error);
    }
}

// === Time-Controlled Locking Functionality === //

/**
 * Checks the current time against lockStartTime and lockEndTime,
 * updates OnlyViewModus (scheduled state) and LockValue accordingly.
 * 
 * IMPORTANT: Manual overrides of LockValue are preserved until the 
 * schedule (OnlyViewModus) actually CHANGES (e.g. crossing 08:00 or 00:00).
 *
 * @param {boolean} allowBroadcast – if true, send broadcast if status CHANGED
 */
function checkAndUpdateLock(allowBroadcast = false) {
  // If either lock time is unset, disable locking entirely
  if (!lockStartTime || !lockEndTime) {
    if (OnlyViewModus !== false) {
      OnlyViewModus = false;
      LockValue = false;
      logInfo('OnlyViewModus disabled because lockStartTime or lockEndTime is not set.');
      // Broadcast change
      if (allowBroadcast) {
        broadcastLockState();
      }
    }
    return;
  }

  // Parse current time in minutes since midnight
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Parse start and end times
  const [startH, startM] = lockStartTime.split(':').map(Number);
  const [endH, endM]   = lockEndTime.split(':').map(Number);

  // Validate time format
  if (
    [startH, startM, endH, endM].some(n => isNaN(n)) ||
    startH < 0 || startH > 23 || endH < 0 || endH > 23 ||
    startM < 0 || startM > 59 || endM < 0 || endM > 59
  ) {
    if (OnlyViewModus !== false) {
        logError('Invalid lockStartTime or lockEndTime format. Disabling lock.');
        OnlyViewModus = false;
        LockValue     = false;
        if (allowBroadcast) {
            broadcastLockState();
        }
    }
    return;
  }

  const startMinutes = startH * 60 + startM;
  const endMinutes   = endH   * 60 + endM;

  // Determine if we should be in locked mode
  let shouldLock;
  if (startMinutes < endMinutes) {
    // Range does not cross midnight
    shouldLock = currentMinutes >= startMinutes && currentMinutes < endMinutes;
  } else {
    // Range crosses midnight
    shouldLock = currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }

  const prevTimeBasedState = OnlyViewModus;
  
  // Update time-based state tracker
  OnlyViewModus = shouldLock;

  // Update actual LockValue ONLY if the schedule state has changed (e.g. time boundary crossed)
  // OR if this is the first run (prevTimeBasedState is null).
  if (prevTimeBasedState !== shouldLock) {
      LockValue = shouldLock;
      
      if (prevTimeBasedState !== null) {
          logInfo(`Schedule boundary crossed (Time: ${now.toLocaleTimeString()}). Switching LockValue to ${LockValue} (Schedule: ${prevTimeBasedState} -> ${shouldLock}).`);
          if (allowBroadcast) {
              broadcastLockState();
          }
      } else {
          // First run initialization
          logInfo(`Startup time check (Time: ${now.toLocaleTimeString()}). Initializing LockValue to ${LockValue}.`);
      }
  }
  // Else: We do nothing. If LockValue differs from shouldLock (due to manual override),
  // we let it stay that way until the next schedule boundary event.
}

/**
 * Sends the current lock state to all connected WebSocket clients
 * and to the external WebSocket server.
 */
function broadcastLockState() {
  const message = JSON.stringify({
    type:   'Rotor',
    lock:   LockValue,
    source: clientIp
  });

  // 1) Broadcast to internal clients
  if (typeof wss !== 'undefined') {
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  // 2) Send to external WebSocket server
  if (externalWs && externalWs.readyState === WebSocket.OPEN) {
    externalWs.send(message);
  }
}

/**
 * Starts ES Follow polling if not already running.
 */
function startESFollow() {
  if (esFollowIntervalId === null && FMLIST_OMID) {
    fetchESAzimuth();  // immediate fetch
    esFollowIntervalId = setInterval(fetchESAzimuth, 60 * 1000);
    logInfo('ES Follow timer started');
  }
}

/**
 * Stops ES Follow polling if running.
 */
function stopESFollow() {
  if (esFollowIntervalId !== null) {
    clearInterval(esFollowIntervalId);
    esFollowIntervalId = null;
    logInfo('ES Follow timer stopped');
  }
}

// === Helper to toggle follow mode consistently ===
function setFollowMode(enabled) {
  follow = enabled;
  if (follow) startESFollow();
  else       stopESFollow();
}

// Initial toggle based on configuration
setFollowMode(!!ESfollowOnStart);

/**
 * Fetches ES alert data, logs all azimuths, and moves rotor to their average.
 * Only processes fresh alerts (≤ LAST_ALERT_MINUTES) and each alert once.
 */
async function fetchESAzimuth() {
  if (!follow || !FMLIST_OMID) return;

  const url = `https://www.fmlist.org/esapi/es${FMLIST_OMID}.json?cb=${Date.now()}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      logError(`ES Follow: HTTP ${res.status} when fetching OMID ${FMLIST_OMID}`);
      return;
    }

    const { esalert = {} } = await res.json();
    const tsString = esalert.esdatetime;
    if (!tsString) {
      logError(`ES Follow: No timestamp in response for OMID ${FMLIST_OMID}`);
      return;
    }

    const ts = Date.parse(tsString);
    if (isNaN(ts)) {
      logError(`ES Follow: Invalid timestamp "${tsString}" for OMID ${FMLIST_OMID}`);
      return;
    }

    const ageMin = (Date.now() - ts) / 60000;
    if (ageMin > LAST_ALERT_MINUTES) {
      // logInfo(`ES Follow: Last Alert older than ${LAST_ALERT_MINUTES} min - skipping`);
      return;
    }

    // Only process alerts newer than the last processed
    if (ts <= lastEsTimestamp) return;
    lastEsTimestamp = ts;

    let { directions = [] } = esalert;
    if (typeof directions === 'string') {
      directions = directions
        .split(/[\s,]+/)
        .map(x => Number(x.trim()))
        .filter(n => !isNaN(n));
    }
	
	// directions = [112, 166, 173, 188, 199];	// test values

    if (directions.length > 0) {
      // Log all received azimuth values
      logInfo(`Rotor received ES value(s): ${directions.join('°, ')}°`);

      // Compute average and round to nearest whole degree
      const sum = directions.reduce((acc, v) => acc + v, 0);
      const avg = Math.round(sum / directions.length);

      // Command rotor to move to the average azimuth
      updatePstRotator(avg);
      logInfo(`Rotor moving to average ES azimuth: ${avg}°`);
    }
  } catch (err) {
    //logError(`ES Follow: Error fetching/parsing OMID ${FMLIST_OMID}: ${err.message}`);
  }
}