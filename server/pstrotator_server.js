/////////////////////////////////////////////////////////////
///                                                       ///
///  PST ROTATOR SERVER SCRIPT FOR FM-DX-WEBSERVER (V1.1) ///
///                                                       ///
///  by Highpoint                last update: 24.07.24    ///
///                                                       ///
///  https://github.com/Highpoint2000/PSTRotator          ///
///                                                       ///
/////////////////////////////////////////////////////////////

const port = 3000; // Port for the CORS Proxy and WebSocket server
const PSTRotatorUrl = 'http://127.0.0.1:80'; // Base URL (http://IP:Port) for the PST Rotator software

/////////////////////////////////////////////////////////////

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

// Start the HTTP server and listen on the specified port
const server = app.listen(port, () => {
    logInfo(`Proxy server is running on http://localhost:${port}`); // Use custom logInfo function
});

// Create a WebSocket server that uses the existing HTTP server
const wss = new WebSocket.Server({ server });

// Handle WebSocket connections
wss.on('connection', ws => {
    logInfo('WebSocket connection established'); // Use custom logInfo function

    // Handle incoming messages from WebSocket clients
    ws.on('message', message => {
        logInfo(`Received message: ${message}`); // Use custom logInfo function
    });

    // Handle WebSocket connection closure
    ws.on('close', () => {
        logInfo('WebSocket connection closed'); // Use custom logInfo function
    });

    // Handle WebSocket errors
    ws.on('error', error => {
        logError('WebSocket error: ' + error); // Use custom logError function
    });
});

// Function to check if the PST Rotator web server is available
async function checkWebsiteAvailability() {
    const proxyUrl = `http://127.0.0.1:${port}/proxy?url=${PSTRotatorUrl}/PstRotatorAz.htm`;

    try {
        const response = await fetch(proxyUrl); // Fetch the page through the proxy
        if (response.ok) {
            logInfo(`PST Rotator web server ${PSTRotatorUrl} is reachable through the proxy.`);
            return true; // Return true if the response is successful
        } else {
            logError(`PST Rotator web server ${PSTRotatorUrl} is not reachable. Status: ${response.status}`);
            return false; // Return false if the response is not successful
        }
    } catch (error) {
        logError('Error checking PST Rotator web server availability: ' + error);
        return false; // Return false if there is an error
    }
}

// Function to fetch and process data from the PST Rotator web server
async function fetchAndProcessData() {
    const proxyUrl = `http://127.0.0.1:${port}/proxy?url=${PSTRotatorUrl}/PstRotatorAz.htm`;

    try {
        const response = await fetch(proxyUrl); // Fetch the page through the proxy
        const text = await response.text(); // Get the response body as text

        const { document } = (new JSDOM(text)).window; // Create a JSDOM instance to parse HTML
        const bearingElement = Array.from(document.querySelectorAll('*')).find(el => el.textContent.includes('Bearing')); // Find element containing "Bearing"

        let bearingValue = 'Bearing value not found.'; // Default message if bearing value is not found

        if (bearingElement) {
            const bearingText = bearingElement.textContent; // Get text content of the element
            const bearingRegex = /Bearing\s*[:=]\s*([^\s<]+)/; // Regex to extract bearing value
            const match = bearingText.match(bearingRegex); // Match the regex against the bearing text

            if (match) {
                bearingValue = match[1]; // Extract bearing value from regex match
            }
        }

        // Send the bearing value to all connected WebSocket clients
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(bearingValue); // Send the bearing value to each client
            }
        });

    } catch (error) {
        logError('Error fetching or parsing the page: ' + error); // Use custom logError function
    }
}

// Check the availability of the PST Rotator web server before starting the polling loop
checkWebsiteAvailability().then(isAvailable => {
    if (isAvailable) {
        // Start the regular polling if the website is available
        setInterval(fetchAndProcessData, 1000); // Poll every 1000 milliseconds (1 second)
    } else {
        logError('Polling loop will not start because the PST Rotator web server is not reachable.'); // Use custom logError function
    }
});
/////////////////////////////////////////////////////////////
///                                                       ///
///  PST ROTATOR SERVER SCRIPT FOR FM-DX-WEBSERVER (V1.0) ///
///                                                       ///
///  by Highpoint                last update: 23.07.24    ///
///                                                       ///
///  https://github.com/Highpoint2000/PSTRotator          ///
///                                                       ///
/////////////////////////////////////////////////////////////

const port = 3000; // Port for the CORS Proxy and WebSocket server
const PSTRotatorUrl = 'http://127.0.0.1:80'; // Base URL (http://IP:Port) for the PST Rotator software

/////////////////////////////////////////////////////////////

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
        console.error('rotor.js: Error fetching the URL:', error); // Log any errors
        res.status(500).send('Error fetching the URL'); // Respond with an error if fetching fails
    }
});

// Start the HTTP server and listen on the specified port
const server = app.listen(port, () => {
    console.log(`rotor.js: Proxy server is running on http://localhost:${port}`);
});

// Create a WebSocket server that uses the existing HTTP server
const wss = new WebSocket.Server({ server });

// Handle WebSocket connections
wss.on('connection', ws => {
    console.log('rotor.js: WebSocket connection established');

    // Handle incoming messages from WebSocket clients
    ws.on('message', message => {
        console.log(`rotor.js: Received message: ${message}`);
    });

    // Handle WebSocket connection closure
    ws.on('close', () => {
        console.log('rotor.js: WebSocket connection closed');
    });

    // Handle WebSocket errors
    ws.on('error', error => {
        console.error('rotor.js: WebSocket error:', error);
    });
});

// Function to check if the PST Rotator web server is available
async function checkWebsiteAvailability() {
    const proxyUrl = `http://127.0.0.1:${port}/proxy?url=${PSTRotatorUrl}/PstRotatorAz.htm`;

    try {
        const response = await fetch(proxyUrl); // Fetch the page through the proxy
        if (response.ok) {
            console.log(`rotor.js: PST Rotator web server ${PSTRotatorUrl} is reachable through the proxy.`);
            return true; // Return true if the response is successful
        } else {
            console.error(`rotor.js: PST Rotator web server ${PSTRotatorUrl} is not reachable. Status: ${response.status}`);
            return false; // Return false if the response is not successful
        }
    } catch (error) {
        console.error(`rotor.js: Error checking PST Rotator web server availability:`, error);
        return false; // Return false if there is an error
    }
}

// Function to fetch and process data from the PST Rotator web server
async function fetchAndProcessData() {
    const proxyUrl = `http://127.0.0.1:${port}/proxy?url=${PSTRotatorUrl}/PstRotatorAz.htm`;

    try {
        const response = await fetch(proxyUrl); // Fetch the page through the proxy
        const text = await response.text(); // Get the response body as text

        const { document } = (new JSDOM(text)).window; // Create a JSDOM instance to parse HTML
        const bearingElement = Array.from(document.querySelectorAll('*')).find(el => el.textContent.includes('Bearing')); // Find element containing "Bearing"

        let bearingValue = 'Bearing value not found.'; // Default message if bearing value is not found

        if (bearingElement) {
            const bearingText = bearingElement.textContent; // Get text content of the element
            const bearingRegex = /Bearing\s*[:=]\s*([^\s<]+)/; // Regex to extract bearing value
            const match = bearingText.match(bearingRegex); // Match the regex against the bearing text

            if (match) {
                bearingValue = match[1]; // Extract bearing value from regex match
            }
        }

        // Send the bearing value to all connected WebSocket clients
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(bearingValue); // Send the bearing value to each client
            }
        });

    } catch (error) {
        console.error('rotor.js: Error fetching or parsing the page:', error); // Log any errors
    }
}

// Check the availability of the PST Rotator web server before starting the polling loop
checkWebsiteAvailability().then(isAvailable => {
    if (isAvailable) {
        // Start the regular polling if the website is available
        setInterval(fetchAndProcessData, 1000); // Poll every 1000 milliseconds (1 second)
    } else {
        console.error('rotor.js: Polling loop will not start because the PST Rotator web server is not reachable.'); // Log if the server is not reachable
    }
});
