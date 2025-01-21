////////////////////////////////////////////////////////////////////
///                                                              ///
///  PST ROTATOR SERVER SCRIPT FOR FM-DX-WEBSERVER (V2.3c)       ///
///                                                              ///
///  by Highpoint                         last update: 21.01.25  ///
///                                                              ///
////////////////////////////////////////////////////////////////////

const path = require('path');
const fs = require('fs');
const { logInfo, logError } = require('./../../server/console');

// Define the source and target paths for rotor.png
const sourceImagePath = path.join(__dirname, 'rotor.png');
const targetImagePath = path.join(__dirname, './../../web/images/rotor.png');

// Function to copy rotor.png if it doesn't exist in the target directory
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
                    //logInfo(`rotor.png successfully copied to ${targetImagePath}`);
                }
            });
        } else {
            logError(`Source rotor.png not found at ${sourceImagePath}`);
        }
    } else {
        //logInfo(`rotor.png already exists in ${targetImagePath}`);
    }
}

// Call the function to perform the copy operation at startup
copyRotorImage();

// Define the paths to the old and new configuration files
const oldConfigFilePath = path.join(__dirname, 'configPlugin.json');
const newConfigFilePath = path.join(__dirname, './../../plugins_configs/pstrotator.json');

// Default values for the configuration file 
// Do not enter these values !!! Save your configuration in pstrotator.json. This is created automatically when you first start.

const defaultConfig = {
    PSTRotatorUrl: 'http://127.0.0.1:80',       // Base URL for the PST Rotator software
    port: 3000,                                // Port for the internal CORS Proxy (default: 3000)
    RotorLimitLineLength: 0,                   // Set the length of the line (default: 67, none: 0)
    RotorLimitLineAngle: 129,                  // Set the angle of the line (e.g., 180)
    RotorLimitLineColor: '#808080',            // Set the color for the additional line (default: #808080)
    lockStartTime: '',                         // Start time for locking in HH:MM format (empty means no locking / 00:00 = 24h lock)
    lockEndTime: ''                            // End time for locking in HH:MM format (empty means no locking) / 00:00 = 24h lock)
};

// Function to merge default config with existing config and remove undefined values
function mergeConfig(defaultConfig, existingConfig) {
    const updatedConfig = {};

    // Add the existing values that match defaultConfig keys
    for (const key in defaultConfig) {
        // If the existingConfig has the key, use it; otherwise, use the default
        updatedConfig[key] = key in existingConfig ? existingConfig[key] : defaultConfig[key];
    }

    return updatedConfig;
}

// Function to load the old config, move it to the new location, and delete the old one
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

function loadConfig(filePath) {
    let existingConfig = {};

    // Try to migrate the old config if it exists
    const migratedConfig = migrateOldConfig(oldConfigFilePath, filePath);
    if (migratedConfig) {
        existingConfig = migratedConfig;
    } else {
        // Check if the new configuration file exists
        if (fs.existsSync(filePath)) {
            // Read the existing configuration file
            existingConfig = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        } else {
            logInfo('Scanner configuration not found. Creating pstrotator.json.');
        }
    }

    // Merge the default config with the existing one, adding missing fields and removing undefined
    const finalConfig = mergeConfig(defaultConfig, existingConfig);

    // Write the updated configuration back to the file (if changes were made)
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

// Initialize OnlyViewModus based on time-controlled locking
let OnlyViewModus = false; // Default value; will be set by the locking function
let LockValue = true;      // Initial declaration
let lock = true;

// Path to the target JavaScript file
const PSTrotatorClientFile = path.join(__dirname, 'pstrotator.js');

// Function to start the process
function updateSettings() {
  // Read the target file
  fs.readFile(PSTrotatorClientFile, 'utf8', (err, targetData) => {
    if (err) {
      logError('Error reading the pstrotator.js file:', err);
      return;
    }

    // Check if the variables already exist
    let hasRotorLimitLineLength = /const RotorLimitLineLength = .+;/.test(targetData);
    let hasRotorLimitLineAngle = /const RotorLimitLineAngle = .+;/.test(targetData);
    let hasRotorLimitLineColor = /const RotorLimitLineColor = .+;/.test(targetData);

    // Replace or add the definitions
    let updatedData = targetData;

    if (hasRotorLimitLineLength) {
      updatedData = updatedData.replace(/const RotorLimitLineLength = .*;/, `const RotorLimitLineLength = ${RotorLimitLineLength};`);
    } else {
      updatedData = `const RotorLimitLineLength = ${RotorLimitLineLength};\n` + updatedData;
    }

    if (hasRotorLimitLineAngle) {
      updatedData = updatedData.replace(/const RotorLimitLineAngle = .*;/, `const RotorLimitLineAngle = ${RotorLimitLineAngle};`);
    } else {
      updatedData = `const RotorLimitLineAngle = ${RotorLimitLineAngle};\n` + updatedData;
    }
	
    if (hasRotorLimitLineColor) {
      updatedData = updatedData.replace(/const RotorLimitLineColor = .*;/, `const RotorLimitLineColor = '${RotorLimitLineColor}';`);
    } else {
      updatedData = `const RotorLimitLineColor = '${RotorLimitLineColor}';\n` + updatedData;
    }

    // Update/write the target file
    fs.writeFile(PSTrotatorClientFile, updatedData, 'utf8', (err) => {
      if (err) {
        logError('Error writing to the pstrotator.js file:', err);
        return;
      }
      logInfo('PSTrotator.js file successfully updated');
    });
  });
}

// Call the updateSettings function
updateSettings();

///////////////////////////////////////////////////////////////

// Load port configuration from config.json
const config = require('./../../config.json');
const webserverPort = config.webserver.webserverPort || 8080; // Use the port from config.json or default to 8080
const externalWsUrl = `ws://127.0.0.1:${webserverPort}/data_plugins`;

// Function to check and install missing NewModules
const { execSync } = require('child_process');
const NewModules = [
    'jsdom',
];

function checkAndInstallNewModules() {
    NewModules.forEach(module => {
        const modulePath = path.join(__dirname, './../../node_modules', module);
        if (!fs.existsSync(modulePath)) {
            console.log(`Module ${module} is missing. Installing...`);
            try {
                execSync(`npm install ${module}`, { stdio: 'inherit' });
                console.log(`Module ${module} installed successfully.`);
            } catch (error) {
                logError(`Error installing module ${module}:`, error);
                process.exit(1); // Exit the process with an error code
            }
        } else {
            // console.log(`Module ${module} is already installed.`);
        }
    });
}

// Check and install missing NewModules before starting the server
checkAndInstallNewModules();

// Import necessary modules
const express = require('express'); // For creating the HTTP server
const fetch = require('node-fetch'); // For making HTTP requests
const { JSDOM } = require('jsdom'); // For parsing and manipulating HTML
const WebSocket = require('ws'); // For WebSocket communication
const app = express(); // Initialize Express application

// Middleware to handle CORS (Cross-Origin Resource Sharing) settings
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*'); // Allow requests from any origin
    res.setHeader('Access-Control-Allow-Methods', 'GET'); // Allow only GET requests
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type'); // Allow Content-Type header
    next(); // Proceed to the next middleware or route handler
});

// Route to act as a proxy for fetching data from other URLs
app.get('/proxy', async (req, res) => {
    const targetUrl = req.query.url; // Get the target URL from query parameters
    if (!targetUrl) {
        return res.status(400).send('URL parameter missing'); // Respond with an error if URL is missing
    }

    try {
        const response = await fetch(targetUrl); // Fetch the data from the target URL
        const body = await response.text(); // Get the response body as text
        res.send(body); // Send the body as the response
    } catch (error) {
        logError('Error fetching the URL: ' + error); // Use custom logError function
        res.status(500).send('Error fetching the URL'); // Respond with an error if fetching fails
    }
});

// Initialize global variables
const clientIp = '127.0.0.1'; // Define the client IP address
let lastBearingValue = null; // Variable to store the last bearing value
let externalWs = null; // Define externalWs as a global variable

// Start the HTTP server and listen on the specified port
const server = app.listen(port, () => {
    logInfo(`Rotor Proxy server is running on http://localhost:${port}`); // Use custom logInfo function

    // Start the server and delay WebSocket initialization
    setTimeout(() => {
        initializeWebSockets(); // Initialize WebSocket connections after a delay
        checkWebsiteAvailability().then(isAvailable => {
            if (isAvailable) {
                setInterval(fetchAndProcessData, 500); // Poll every 500 milliseconds
            } else {
                logError('Polling loop will not start because the PST Rotator web server is not reachable.');
            }
        });
    }, 1000); // Delay of 1000 milliseconds (1 second)

    // Initialize the lock based on current time
    checkAndUpdateLock();

    // Schedule the lock check to run every minute
    setInterval(checkAndUpdateLock, 60 * 1000); // Every 60,000 milliseconds (1 minute)
});

// Function to initialize WebSocket connections
function initializeWebSockets() {
    // Create a WebSocket server that uses the existing HTTP server
    const wss = new WebSocket.Server({ server });
    wss.binaryType = 'text'; // Set the type of received data to text

    // Handle WebSocket connections
    wss.on('connection', ws => {
        //logInfo('WebSocket connection established'); // Use custom logInfo function

        // Handle incoming messages from WebSocket clients
        ws.on('message', message => {
            logInfo(`${message.type} received ${message.value}° from ${message.source}`);

            try {
                const messageObject = JSON.parse(message);
                logInfo(`Parsed message: ${JSON.stringify(messageObject)}`);

                if (!messageObject.source) {
                    messageObject.source = clientIp;
                }

                if (messageObject.type === 'Rotor' && messageObject.value === 'request') {
                    logInfo('Received request for bearing value');
					
					if (OnlyViewModus) {
						LockValue = true;
					}

                    const responseMessage = JSON.stringify({
                        type: 'Rotor',
                        value: lastBearingValue || 'No bearing data available',
						lock: LockValue,
                        source: clientIp
                    });
                    ws.send(responseMessage);
                    logInfo(`Rotor respond lastBearingValue°`);
                } else if (messageObject.type === 'Rotor' && messageObject.value !== 'request' && messageObject.source !== '127.0.0.1') {
                    logInfo('Received update for bearing value');

                    // Call function to update PST Rotator
                    updatePstRotator(messageObject.value);
                } else {
                    logInfo('Message type or value did not match expected criteria');
                }

                // Broadcast the message to all connected clients except the sender
                wss.clients.forEach(client => {
                    if (client !== ws && client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify(messageObject));
                    }
                });

            } catch (error) {
                logError('Error processing WebSocket message: ' + error);
            }
        });

        ws.on('close', () => {
            logInfo('WebSocket connection closed');
        });

        ws.on('error', error => {
            logError('WebSocket error: ' + error);
        });
    });

    // Create a WebSocket client for sending data to the external server
    externalWs = new WebSocket(externalWsUrl);

    externalWs.on('open', () => {
        logInfo(`Rotor connected to external WebSocket server at ${externalWsUrl}`);
    });

    externalWs.on('message', message => {
        try {
            const messageObject = JSON.parse(message);

            if (messageObject.type === 'Rotor' && messageObject.value === 'request' && messageObject.source !== '127.0.0.1') {
                logInfo(`Rotor request from ${messageObject.source}`);
				
				if (OnlyViewModus) {
					LockValue = true;
				}

                const responseMessage = JSON.stringify({
                    type: 'Rotor',
                    value: lastBearingValue || 'No bearing data available',
					lock: LockValue,
                    source: clientIp
                });
                externalWs.send(responseMessage);
                logInfo(`Rotor respond ${lastBearingValue}° and lock ${LockValue}`);
            } else if (messageObject.type === 'Rotor' && messageObject.value !== 'request' && messageObject.source !== '127.0.0.1') {
				if (!messageObject.value) {
					logInfo(`Rotor request lock ${messageObject.lock} from ${messageObject.source}`);
					
					if (OnlyViewModus) {
						LockValue = true;
					} else {
						LockValue = messageObject.lock;
					}
					
					const responseMessage = JSON.stringify({
						type: 'Rotor',
						value: lastBearingValue || 'No bearing data available',
						lock: LockValue,
						source: clientIp
					});
					
					externalWs.send(responseMessage);			
					logInfo(`Rotor respond ${lastBearingValue}° and lock ${LockValue}`);
					
				} else {
					
					if (OnlyViewModus) {
						LockValue = true;
					} else {					
						logInfo(`Rotor request ${messageObject.value}° from ${messageObject.source}`);
						updatePstRotator(messageObject.value); // Update PST Rotator with the received value
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

// Function to check if the PST Rotator web server is available
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

// Function to fetch and process data from the PST Rotator web server
async function fetchAndProcessData() {
    const proxyUrl = `http://127.0.0.1:${port}/proxy?url=${PSTRotatorUrl}/PstRotatorAz.htm`;

    try {
        const response = await fetch(proxyUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const text = await response.text();

        const { document } = (new JSDOM(text)).window;
        const bearingElement = Array.from(document.querySelectorAll('*')).find(el => el.textContent.includes('Bearing'));

        let bearingValue = 'Bearing value not found.';

        if (bearingElement) {
            const bearingText = bearingElement.textContent;
            const bearingRegex = /Bearing\s*[:=]\s*([^\s<]+)/;
            const match = bearingText.match(bearingRegex);

            if (match) {
                bearingValue = match[1];
            }
        }

        if (bearingValue !== lastBearingValue) {
            const message = JSON.stringify({ type: 'Rotor', value: bearingValue, source: clientIp });

            if (externalWs && externalWs.readyState === WebSocket.OPEN) {
                externalWs.send(message);
                logInfo(`Rotor broadcast ${bearingValue}°`);
                lastBearingValue = bearingValue;
            } else {
                logError('External WebSocket connection is not open');
            }
        }

    } catch (error) {
        logError('Error fetching or parsing the page: ' + error);
    }
}

// Function to update the PST Rotator page with the new bearing value
async function updatePstRotator(value) {
    const formActionUrl = `${PSTRotatorUrl}/PstRotatorAz.htm`; // The form action URL
    
    // Construct URL with query parameters
    const url = new URL(formActionUrl);
    url.searchParams.append('az', value);

    try {
        // Fetch the page content (optional, only if needed for debugging)
        const response = await fetch(url.toString(), {
            method: 'GET'
        });

        if (response.ok) {
            logInfo(`Rotor turns up to ${value}°`);
        } else {
            logError(`Rotor: Form submission failed. Status: ${response.status}`);
        }
    } catch (error) {
        logError('Error updating PST Rotator: ' + error);
    }
}   

///////////////////////////////////////////////////////////////

// === Time-Controlled Locking Functionality === //

/**
 * Function to check current time against lockStartTime and lockEndTime
 * and update OnlyViewModus accordingly.
 * If either lockStartTime or lockEndTime is empty, OnlyViewModus is set to false.
 */
function checkAndUpdateLock() {
    // If either lockStartTime or lockEndTime is not set, disable locking
    if (!lockStartTime || !lockEndTime) {
        if (OnlyViewModus !== false) {
            OnlyViewModus = false;
            LockValue = false; // Ensure LockValue reflects OnlyViewModus
            logInfo(`OnlyViewModus set to false because lockStartTime or lockEndTime is not set.`);
        }
        return;
    }

    const now = new Date();
    const currentTimeMinutes = now.getHours() * 60 + now.getMinutes(); // Current time in minutes since midnight

    const [startHour, startMinute] = lockStartTime.split(':').map(Number);
    const [endHour, endMinute] = lockEndTime.split(':').map(Number);

    // Validate the time components
    if (
        isNaN(startHour) || isNaN(startMinute) ||
        isNaN(endHour) || isNaN(endMinute) ||
        startHour < 0 || startHour > 23 ||
        endHour < 0 || endHour > 23 ||
        startMinute < 0 || startMinute > 59 ||
        endMinute < 0 || endMinute > 59
    ) {
        logError('Invalid lockStartTime or lockEndTime format. OnlyViewModus set to false.');
        OnlyViewModus = false;
        LockValue = false;
        return;
    }

    const startTimeMinutes = startHour * 60 + startMinute;
    const endTimeMinutes = endHour * 60 + endMinute;

    let shouldLock;

    if (startTimeMinutes < endTimeMinutes) {
        // Time range does not cross midnight
        shouldLock = currentTimeMinutes >= startTimeMinutes && currentTimeMinutes < endTimeMinutes;
    } else {
        // Time range crosses midnight
        shouldLock = currentTimeMinutes >= startTimeMinutes || currentTimeMinutes < endTimeMinutes;
    }

    if (shouldLock !== OnlyViewModus) {
        OnlyViewModus = shouldLock;
        LockValue = OnlyViewModus; // Update LockValue based on OnlyViewModus

        logInfo(`OnlyViewModus set to ${OnlyViewModus} based on current time (${now.toLocaleTimeString()}).`);
    }
}

// === End of Time-Controlled Locking Functionality === //
