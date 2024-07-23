/////////////////////////////////////////////////////////////
///                                                       ///
///  PST ROTATOR SERVER SCRIPT FOR FM-DX-WEBSERVER (V1.0) ///
///                                                       ///
///  by Highpoint                last update: 23.07.24    ///
///                                                       ///
///  https://github.com/Highpoint2000/PSTRotator   		  ///
///                                                       ///
/////////////////////////////////////////////////////////////


const express = require('express');
const fetch = require('node-fetch');
const { JSDOM } = require('jsdom');
const WebSocket = require('ws');

const app = express();
const port = 3000;

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

app.get('/proxy', async (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) {
        return res.status(400).send('URL-Parameter fehlt');
    }

    try {
        const response = await fetch(targetUrl);
        const body = await response.text();
        res.send(body);
    } catch (error) {
        console.error('rotor.js: Fehler beim Abrufen der URL:', error);
        res.status(500).send('Fehler beim Abrufen der URL');
    }
});

const server = app.listen(port, () => {
    console.log(`rotor.js: Proxy-Server läuft auf http://localhost:${port}`);
});

const wss = new WebSocket.Server({ server });

// WebSocket-Verbindungen behandeln
wss.on('connection', ws => {
    console.log('rotor.js: WebSocket-Verbindung hergestellt');

    // Beim Empfangen von Nachrichten
    ws.on('message', message => {
        console.log(`rotor.js: Erhaltene Nachricht: ${message}`);
    });

    // Beim Schließen der Verbindung
    ws.on('close', () => {
        console.log('rotor.js: WebSocket-Verbindung geschlossen');
    });

    // Fehlerbehandlung
    ws.on('error', error => {
        console.error('rotor.js: WebSocket-Fehler:', error);
    });
});

async function fetchAndProcessData() {
    const proxyUrl = `http://localhost:${port}/proxy?url=http://127.0.0.1/PstRotatorAz.htm`;

    try {
        const response = await fetch(proxyUrl);
        const text = await response.text();

        const { document } = (new JSDOM(text)).window;
        const bearingElement = Array.from(document.querySelectorAll('*')).find(el => el.textContent.includes('Bearing'));

        let bearingValue = 'Bearing Wert nicht gefunden.';

        if (bearingElement) {
            const bearingText = bearingElement.textContent;
            const bearingRegex = /Bearing\s*[:=]\s*([^\s<]+)/;
            const match = bearingText.match(bearingRegex);

            if (match) {
                bearingValue = match[1];
            }
        }

        // Sende den Bearing-Wert an alle verbundenen WebSocket-Clients
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(bearingValue);
            }
        });

    } catch (error) {
        console.error('rotor.js: Fehler beim Abrufen oder Parsen der Seite:', error);
    }
}

// Starte die regelmäßige Abfrage
setInterval(fetchAndProcessData, 1000); // 1000 Millisekunden = 1 Sekunde
