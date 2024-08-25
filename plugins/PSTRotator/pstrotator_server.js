///////////////////////////////////////////////////////////////////
///                                                             ///
///  PST ROTATOR SERVER SCRIPT FOR FM-DX-WEBSERVER (V2.0a) BETA ///
///                                                             ///
///  by Highpoint                         last update: 25.08.24 ///
///                                                             ///
///  https://github.com/Highpoint2000/PSTRotator                ///
///                                                             ///
///////////////////////////////////////////////////////////////////

/// only works from webserver version 1.2.6 !!!

const PSTRotatorUrl = 'http://127.0.0.1:80'; // Base URL for the PST Rotator software
const port = 3000; // Port for the internal CORS Proxy (default: 3000)

//////////////////////////////////////////////////////////////

// Load port configuration from config.json
const config = require('./../../config.json');
const webserverPort = config.webserver.webserverPort || 8080; // Use the port from config.json or default to 8080
const externalWsUrl = `ws://127.0.0.1:${webserverPort}/extra`;

// Function to check and install missing NewModules
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

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

// Import custom logging functions
const { logInfo, logError } = require('./../../server/console');

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
                setInterval(fetchAndProcessData, 500); // Poll every 100 milliseconds
            } else {
                logError('Polling loop will not start because the PST Rotator web server is not reachable.');
            }
        });
    }, 1000); // Delay of 1000 milliseconds (1 second)
});

// Function to initialize WebSocket connections
function initializeWebSockets() {
    // Create a WebSocket server that uses the existing HTTP server
    const wss = new WebSocket.Server({ server });
    wss.binaryType = 'text'; // Setzt den Typ der empfangenen Daten auf Text

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

                    const responseMessage = JSON.stringify({
                        type: 'Rotor',
                        value: lastBearingValue || 'No bearing data available',
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

                const responseMessage = JSON.stringify({
                    type: 'Rotor',
                    value: lastBearingValue || 'No bearing data available',
                    source: clientIp
                });
                externalWs.send(responseMessage);
                logInfo(`Rotor respond ${lastBearingValue}°`);
            } else if (messageObject.type === 'Rotor' && messageObject.value !== 'request' && messageObject.source !== '127.0.0.1') {
                logInfo(`Rotor request ${messageObject.value}° from ${messageObject.source}`);
                updatePstRotator(messageObject.value); // Update PST Rotator with the received value
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
