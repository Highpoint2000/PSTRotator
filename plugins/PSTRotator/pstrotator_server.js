//////////////////////////////////////////////////////////////
///                                                        ///
///  PST ROTATOR SERVER SCRIPT FOR FM-DX-WEBSERVER (V1.4)  ///
///                                                        ///
///  by Highpoint                last update: 05.08.24     ///
///                                                        ///
///  https://github.com/Highpoint2000/PSTRotator           ///
///                                                        ///
//////////////////////////////////////////////////////////////

/// only works from webserver version 1.2.6 !!!

const PSTRotatorTcpHost = '127.0.0.1'; // TCP Host for the PST Rotator software
const PSTRotatorTcpPort = 4001; // TCP Port for the PST Rotator software

//////////////////////////////////////////////////////////////

// Load port configuration from config.json
const config = require('./../../config.json');
const webserverPort = config.webserver.webserverPort || 8080; // Use the port from config.json or default to 8080
const externalWsUrl = `ws://127.0.0.1:${webserverPort}/extra`;

// Function to check and install missing NewModules
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const net = require('net'); // Import TCP module

// Import necessary modules
const WebSocket = require('ws'); // For WebSocket communication

// Import custom logging functions
const { logInfo, logError } = require('./../../server/console');

// Initialize global variables
const clientIp = '127.0.0.1'; // Define the client IP address
let lastBearingValue = null; // Variable to store the last bearing value
let externalWs = null; // Define externalWs as a global variable

    // Start the server and delay WebSocket initialization
    setTimeout(() => {
        initializeWebSockets(); // Initialize WebSocket connections after a delay
        setInterval(fetchAndProcessData, 500); // Poll every 500 milliseconds (1 second)
    }, 1000); // Delay of 1000 milliseconds (1 second)

// Function to initialize WebSocket connections
function initializeWebSockets() {
    // Create a WebSocket server that uses the existing HTTP server
    const wss = new WebSocket(externalWsUrl);
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

// Function to fetch and process data from the PST Rotator TCP server
function fetchAndProcessData() {
    const client = new net.Socket();


    client.connect(PSTRotatorTcpPort, PSTRotatorTcpHost, () => {
        // logInfo(`Connected to TCP server at ${PSTRotatorTcpHost}:${PSTRotatorTcpPort}`);
    });

    client.on('data', data => {
        const dataString = data.toString();
        const azValueMatch = dataString.match(/AZ=([\d.]+)/);
        let bearingValue = 'Bearing value not found.';

        if (azValueMatch) {
            // Round the bearing value to the nearest whole number
            const currentBearing = parseFloat(azValueMatch[1]);
            bearingValue = Math.round(currentBearing).toString();
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

        client.destroy(); // Close the connection after receiving the data


    });

    client.on('error', error => {
        logError('Error with TCP connection: ' + error);
    });
}

// Function to update the PST Rotator page with the new bearing value
async function updatePstRotator(value) {
    // Send value with 'M' prefix over TCP
    const tcpClient = new net.Socket();
    const messageToSend = `M${value}\r\n`;


    tcpClient.connect(PSTRotatorTcpPort, PSTRotatorTcpHost, () => {
        logInfo(`Connected to TCP server at ${PSTRotatorTcpHost}:${PSTRotatorTcpPort} for updating bearing`);
        tcpClient.write(messageToSend);
        logInfo(`Sent update to TCP server: ${messageToSend}`);
        tcpClient.end(); // Close the connection after sending the data
    });

    tcpClient.on('error', error => {
        logError('Error with TCP connection: ' + error);
    });
}