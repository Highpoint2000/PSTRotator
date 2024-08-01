/////////////////////////////////////////////////////////////
///                                                       ///
///  PST ROTATOR SERVER SCRIPT FOR FM-DX-WEBSERVER (V1.2) ///
///                                                       ///
///  by Highpoint                last update: 01.08.24    ///
///                                                       ///
///  https://github.com/Highpoint2000/PSTRotator          ///
///                                                       ///
/////////////////////////////////////////////////////////////

/// only works from webserver version 1.2.6 !!!

const port = 3000; // Port for the CORS Proxy and WebSocket server (default: 3000)
const PSTRotatorUrl = 'http://127.0.0.1:80'; // Base URL (http://IP:Port) for the PST Rotator software (default: http://127.0.0.1:80)
const externalWsUrl = 'ws://127.0.0.1:8080/extra'; // URL for the external WebSocket server, please adjust the port if necessary (default: ws://127.0.0.1:8080/extra)

///////////////////////////////////////////////////////////////////////////////////////////////////////

// Import necessary modules
const express = require('express'); // For creating the HTTP server
const fetch = require('node-fetch'); // For making HTTP requests
const { JSDOM } = require('jsdom'); // For parsing and manipulating HTML
const WebSocket = require('ws'); // For WebSocket communication
const app = express(); // Initialize Express application

// Import custom logging functions
const { logInfo, logError } = require('./console');

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
    logInfo(`Proxy server is running on http://localhost:${port}`); // Use custom logInfo function

    // Start the server and delay WebSocket initialization
    setTimeout(() => {
        initializeWebSockets(); // Initialize WebSocket connections after a delay
        checkWebsiteAvailability().then(isAvailable => {
            if (isAvailable) {
                setInterval(fetchAndProcessData, 1000); // Poll every 1000 milliseconds (1 second)
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
            logInfo(`Received message: ${message}`);

            try {
                const messageObject = JSON.parse(message);
                logInfo(`Parsed message: ${JSON.stringify(messageObject)}`);

                if (!messageObject.source) {
                    messageObject.source = clientIp;
                }

                if (messageObject.type === 'rotor' && messageObject.value === 'request') {
                    logInfo('Received request for bearing value');

                    const responseMessage = JSON.stringify({
                        type: 'rotor',
                        value: lastBearingValue || 'No bearing data available',
                        source: clientIp
                    });
                    ws.send(responseMessage);
                    logInfo(`Sent bearing value: ${responseMessage}`);
                } else {
                    logInfo('Message type or value did not match "rotor" and "request"');
                }

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
        logInfo(`Connected to external WebSocket server at ${externalWsUrl}`);
    });

    externalWs.on('message', message => {
        try {
            const messageObject = JSON.parse(message);

            if (messageObject.type === 'rotor' && messageObject.value === 'request' && messageObject.source !== '127.0.0.1') {
                logInfo(`Received: ${message}`);

                const responseMessage = JSON.stringify({
                    type: 'rotor',
                    value: lastBearingValue || 'No bearing data available',
                    source: clientIp
                });
                externalWs.send(responseMessage);
                logInfo(`Sent: ${responseMessage}`);
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
            logInfo(`PST Rotator web server ${PSTRotatorUrl} is reachable through the proxy.`);
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
            const message = JSON.stringify({ type: 'rotor', value: bearingValue, source: clientIp });

            if (externalWs && externalWs.readyState === WebSocket.OPEN) {
                externalWs.send(message);
                logInfo(`Sent: ${message}`);
                lastBearingValue = bearingValue;
            } else {
                logError('External WebSocket connection is not open');
            }
        }

    } catch (error) {
        logError('Error fetching or parsing the page: ' + error);
    }
}
