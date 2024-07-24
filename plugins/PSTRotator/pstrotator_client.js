/////////////////////////////////////////////////////////////
///                                                       ///
///  PST ROTATOR CLIENT SCRIPT FOR FM-DX-WEBSERVER (V1.1) ///
///                                                       ///
///  by Highpoint                last update: 24.07.24    ///
///                                                       ///
///  https://github.com/Highpoint2000/PSTRotator          ///
///                                                       ///
/////////////////////////////////////////////////////////////

(() => {
    // Extract WebserverURL and WebserverPORT from the current page URL
    const currentURL = new URL(window.location.href);
    const WebserverURL = currentURL.hostname;
    const WebserverPORT = currentURL.port;
    const WebsocketPORT = '3000'; // PORT for Websocket/CORS Proxy

    // Configuration variables
    const JQUERY_VERSION = '3.6.0'; // Version of jQuery to use
    const WEBSOCKET_URL = `ws://${WebserverURL}:${WebsocketPORT}`; // WebSocket URL
    const JQUERY_URL = `https://code.jquery.com/jquery-${JQUERY_VERSION}.min.js`; // URL for jQuery
    const IMAGE_URL = `http://${WebserverURL}:${WebserverPORT}/js/plugins/PSTRotator/Rotor.png`; // URL for background image

    let ctx; // Canvas context
    let x, y; // Center coordinates of the canvas
    const radius = 25;
    let lineAngle = 26;
    const lineLength = 74;

    const PSTRotatorPlugin = (() => {
        // Add CSS styles
        const style = document.createElement('style');
        style.textContent = `
            #signal-canvas {
                width: 81%;
            }
            #containerRotator {
                position: relative;
                margin-top: -13%;
                margin-left: 82%; 
            }
            #backgroundRotator {
                position: absolute;      
                width: 220px;
                height: 265px;
            }
            #backgroundRotator img {
                height: 90%;
                margin-top: -60px;
                margin-left: 0px;
                object-fit: cover;
            }
            #CanvasRotator {
                position: relative;
                top: -33px;
                left: -13px;
            }
            #innerCircle {
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 25px;
                height: 25px;
                border-radius: 50%;
                background-color: rgba(255, 255, 255, 0);
                cursor: pointer;
                display: none;		
            }
        `;
        document.head.appendChild(style);

        // Function to dynamically add HTML elements
        function addHtmlElements() {
            const canvascontainerRotator = document.querySelector('.canvas-container');
            if (canvascontainerRotator) {
                console.log('Found .canvas-container element.');

                // Check if the containerRotator already exists
                if (!document.getElementById('containerRotator')) {
                    const containerRotator = document.createElement('div');
                    containerRotator.id = 'containerRotator';
                    containerRotator.innerHTML = `
                        <div class="hide-phone">
                            <div id="backgroundRotator">
                                <img src="${IMAGE_URL}" alt="Background Image">
                            </div>
                            <canvas id="CanvasRotator" width="225" height="225"></canvas>
                            <div id="innerCircle" title="View Bearing Map"></div>
                        </div>
                    `;

                    canvascontainerRotator.appendChild(containerRotator);
                    console.log('HTML elements added successfully.');

                    let $serverInfocontainerRotator = $('#tuner-name').parent();
                    $serverInfocontainerRotator.removeClass('panel-100').addClass('panel-75').css('padding-left', '20px');
                } else {
                    // containerRotator already exists; no action needed
                }
            } else {
                console.error('Element with class "canvas-container" not found');
            }
        }

        // Load a script dynamically
        function loadScript(url, callback) {
            const script = document.createElement('script');
            script.src = url;
            script.onload = callback;
            script.onerror = () => {
                console.error(`Failed to load script: ${url}`);
            };
            document.head.appendChild(script);
        }

        // Function to get the current color from CSS
        function getCurrentColor() {
            return getComputedStyle(document.documentElement).getPropertyValue('--color-5').trim();
        }

        // Function to draw the circle and lines on the canvas
        function drawCircleAndLines() {
            const color = getCurrentColor();
            if (!ctx) return; // Check if ctx is defined

            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, 2 * Math.PI);
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.closePath();

            ctx.font = 'bold 18px Titillium Web, Calibri, sans-serif';
            ctx.fillStyle = color;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText((lineAngle + 90) % 360 + '°', x, y);

            const lineStartX = x + radius * Math.cos(lineAngle * Math.PI / 180);
            const lineStartY = y + radius * Math.sin(lineAngle * Math.PI / 180);
            const lineEndX = x + (radius + lineLength) * Math.cos(lineAngle * Math.PI / 180);
            const lineEndY = y + (radius + lineLength) * Math.sin(lineAngle * Math.PI / 180);

            ctx.beginPath();
            ctx.moveTo(lineStartX, lineStartY);
            ctx.lineTo(lineEndX, lineEndY);
            ctx.strokeStyle = color;
            ctx.stroke();
            ctx.closePath();
        }

        // Function to establish WebSocket connection
        function loadWebSocket() {
            const ws = new WebSocket(WEBSOCKET_URL);

            ws.onopen = () => {
                console.log('WebSocket connection to ' + WEBSOCKET_URL + ' established');
            };

            ws.onmessage = (event) => {
                try {
                    const position = event.data.trim();

                    if (isNaN(position)) {
                        throw new Error('Invalid position data received');
                    }

                    if (position >= 0 && position <= 360) {
                        lineAngle = position - 90;
                        drawCircleAndLines();
                    } else {
                        console.warn('Received position is out of range:', position);
                    }
                } catch (error) {
                    console.error('Error processing WebSocket message:', error);
                }
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };

            ws.onclose = () => {
                console.log('WebSocket connection closed');
            };
        }

        // Main functionality
        function main() {
            const $ = window.jQuery;

            // Ensure jQuery is loaded
            if (!$) {
                console.error('jQuery is not loaded.');
                return;
            }

            addHtmlElements(); // Add HTML elements

            const canvas = $('#CanvasRotator')[0];
            ctx = canvas.getContext('2d'); // Set ctx in the global scope

            x = canvas.width / 2;
            y = canvas.height / 2;

            // Execute functions
            loadWebSocket();
        }

        // Load jQuery and execute the main script
        loadScript(JQUERY_URL, main);

    })();
})();
