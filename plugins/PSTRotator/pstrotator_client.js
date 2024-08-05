//////////////////////////////////////////////////////////////
///                                                        ///
///  PST ROTATOR CLIENT SCRIPT FOR FM-DX-WEBSERVER (V1.4)  ///
///                                                        ///
///  by Highpoint                last update: 05.08.24     ///
///                                                        ///
///  https://github.com/Highpoint2000/PSTRotator           ///
///                                                        ///
//////////////////////////////////////////////////////////////

/// only works from webserver version 1.2.6 !!!

(() => {
    const plugin_version = '1.4'; // Plugin Version

    // Global variable to store the IP address
    let ipAddress;

    // Flag to indicate whether authentication is successful
    let isTuneAuthenticated = false;

    // Extract WebserverURL and WebserverPORT from the current page URL
    const currentURL = new URL(window.location.href);
    const WebserverURL = currentURL.hostname;
    let WebserverPORT = currentURL.port || (currentURL.protocol === 'https:' ? '443' : '80'); // Default ports if not specified

    // Determine WebSocket protocol and port
    const protocol = currentURL.protocol === 'https:' ? 'wss:' : 'ws:'; // Determine WebSocket protocol
    const WebsocketPORT = WebserverPORT; // Use the same port as HTTP/HTTPS
    const WEBSOCKET_URL = `${protocol}//${WebserverURL}:${WebsocketPORT}/extra`; // WebSocket URL with /extra

    // Configuration variables
    const JQUERY_VERSION = '3.6.0'; // Version of jQuery to use
    const JQUERY_URL = `https://code.jquery.com/jquery-${JQUERY_VERSION}.min.js`; // URL for jQuery
    const IMAGE_URL = `http://${WebserverURL}:${WebserverPORT}/js/plugins/PSTRotator/Rotor.png`; // URL for background image

    let ctx; // Canvas context
    let x, y; // Center coordinates of the canvas
    const radius = 25;
    let lineAngle = 26;
    const lineLength = 74;
    let canvas; // Canvas element
    let tooltip; // Tooltip element
    let ws; // WebSocket instance

    async function fetchIpAddress() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            console.error('Failed to fetch IP address:', error);
            return 'unknown'; // Fallback value
        }
    }

    function checkAdminMode() {
        const bodyText = document.body.textContent || document.body.innerText;
        const isAdminLoggedIn = bodyText.includes("You are logged in as an administrator.") || bodyText.includes("You are logged in as an adminstrator.");

        if (isAdminLoggedIn) {
            console.log(`Admin mode found. PSTRotator Plugin Authentication successful.`);
            isTuneAuthenticated = true;
        } else {
            console.log("No authentication. Authentication failed.");
            isTuneAuthenticated = false;
        }
    }

    const PSTRotatorPlugin = (() => {
        // Add CSS styles
        const style = document.createElement('style');
        style.textContent = `
            #signal-canvas {
                width: 81%;
                height: 100%;
            }
            #containerRotator {
                position: relative;
                margin-top: -15%;
                margin-left: 82%; 
                opacity: 0; /* Initially hidden */
                transition: opacity 0.5s ease-in-out; /* Smooth fade-in effect */
            }
            #containerRotator.visible {
                opacity: 1; /* Visible after fade-in */
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
                position: relative;
                top: -145px;
                left: 100px;
                transform: translate(-50%, -50%);
                width: 45px;
                height: 45px;
                border-radius: 50%;
                cursor: pointer;    
            }
            #tooltip {
                position: absolute;
                background: none; 
                color: white; 
                padding: 5px;
                border-radius: 3px;
                font-size: 18px;
                font-family: Titillium Web, Calibri, sans-serif;
                font-weight: bold;
                pointer-events: none; 
                display: none; 
                white-space: nowrap; 
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
                            <div id="innerCircle" title="Plugin Version: ${plugin_version}"></div>
                        </div>
                    `;

                    canvascontainerRotator.appendChild(containerRotator);
                    console.log('HTML elements added successfully.');

                    // Check window width before modifying CSS
                    if (window.innerWidth > 768) {
                        let $serverInfocontainerRotator = $('#tuner-name').parent();
                        $serverInfocontainerRotator.removeClass('panel-100').addClass('panel-75').css('padding-left', '20px');
                    }
                }
            } else {
                console.error('Element with class "canvas-container" not found');
            }

            // Create and append the tooltip element
            tooltip = document.createElement('div');
            tooltip.id = 'tooltip';
            document.body.appendChild(tooltip);
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
		
		// Function to get the current color from CSS
        function getCurrentColor() {
            const color = getComputedStyle(document.documentElement).getPropertyValue('--color-5').trim();
            return color || '#FFFFFF'; // Fallback color
        }

        // Function to send data via WebSocket
        function sendPosition(position) {
            if (ws && ws.readyState === WebSocket.OPEN) {
                const message = JSON.stringify({
                    type: 'Rotor',
                    value: position.toString(),
                    source: ipAddress
                });
                ws.send(message);
                console.log('Sent position:', message);
            } else {
                console.error('WebSocket is not open. Unable to send position.');
            }
        }

        // Function to handle click on the canvas
        function handleCanvasClick(event) {
            if (!isTuneAuthenticated) {
                alert("You must be authenticated to use the PSTRotator feature.");
                return;
            }

            const rect = canvas.getBoundingClientRect();
            const clickX = event.clientX - rect.left;
            const clickY = event.clientY - rect.top;

            // Calculate angle in degrees
            const deltaX = clickX - x;
            const deltaY = clickY - y;
            const angleRad = Math.atan2(deltaY, deltaX);
            let angleDeg = (angleRad * 180 / Math.PI) + 90; // Adjust angle to match the 0-360 scale

            // Normalize angle to be between 0 and 360
            if (angleDeg < 0) {
                angleDeg += 360;
            }

            // Ensure angle is within 0-359 range
            angleDeg = angleDeg % 360;

            // Round the angle and ensure 360 becomes 0
            const roundedAngle = Math.round(angleDeg);
            const finalAngle = roundedAngle === 360 ? 0 : roundedAngle;

            // Send the calculated position
            sendPosition(finalAngle);
        }

        // Function to handle mouse move over the canvas
        function handleCanvasMouseMove(event) {
            if (!isTuneAuthenticated) {
                return; // Do nothing if not authenticated
            }

            const rect = canvas.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;

            // Calculate angle in degrees
            const deltaX = mouseX - x;
            const deltaY = mouseY - y;
            const angleRad = Math.atan2(deltaY, deltaX);
            let angleDeg = (angleRad * 180 / Math.PI) + 90; // Adjust angle to match the 0-360 scale

            // Normalize angle to be between 0 and 360
            if (angleDeg < 0) {
                angleDeg += 360;
            }

            // Ensure angle is within 0-359 range
            angleDeg = angleDeg % 360;

            // Round the angle and ensure 360 becomes 0
            const roundedAngle = Math.round(angleDeg);
            const finalAngle = roundedAngle === 360 ? 0 : roundedAngle;

            // Update tooltip
            tooltip.textContent = finalAngle + '°';
            tooltip.style.left = (event.clientX + 10) + 'px'; // Position the tooltip slightly to the right of the mouse
            tooltip.style.top = (event.clientY + 10) + 'px';  // Position the tooltip slightly below the mouse
            tooltip.style.display = 'block'; // Show the tooltip
        }

        // Function to handle mouse out of the canvas
        function handleCanvasMouseOut() {
            tooltip.style.display = 'none'; // Hide the tooltip when the mouse leaves the canvas
        }

        // Function to load WebSocket and set up event handlers
        function loadWebSocket() {
            ws = new WebSocket(WEBSOCKET_URL);

            ws.onopen = async () => {
                console.log('WebSocket connection to ' + WEBSOCKET_URL + ' established');

                // Fetch IP address and send the initial request
                ipAddress = await fetchIpAddress();
                const requestPayload = JSON.stringify({
                    type: 'Rotor',
                    value: 'request',
                    source: ipAddress
                });
                ws.send(requestPayload);
                console.log('Sent:', requestPayload);
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data); // Parse the JSON data

                    // Only process messages where type is "Rotor"
                    if (data.type === 'Rotor') {
                        // Skip messages from the own IP address
                        if (data.source === ipAddress) {
                            return;
                        }

                        console.log('Received:', data);

                        // Extract position from JSON data
                        const position = parseFloat(data.value);

                        // Check if position is a valid number
                        if (isNaN(position)) {
                            console.error('Received position is not a valid number:', data.value);
                            return; // Abort processing
                        }

                        // Check if position is within valid range
                        if (position >= 0 && position <= 360) {
                            lineAngle = position - 90;
                            drawCircleAndLines();
                        } else {
                            console.warn('Received position is out of range:', position);
                        }
                    }
                    // All other messages are ignored
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

        // Function to observe CSS variable changes
        function observeColorChanges() {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.attributeName === 'style') {
                        drawCircleAndLines(); // Redraw the canvas if colors are updated
                    }
                });
            });

            observer.observe(document.documentElement, {
                attributes: true,
                attributeFilter: ['style']
            });
        }

        // Main function to initialize the plugin
        function main() {
            const $ = window.jQuery;

            if (!$) {
                console.error('jQuery is not loaded.');
                return;
            }

            addHtmlElements(); // Add HTML elements

            canvas = $('#CanvasRotator')[0]; // Get canvas element
            ctx = canvas.getContext('2d'); // Set ctx in global scope

            x = canvas.width / 2;
            y = canvas.height / 2;

            canvas.addEventListener('click', handleCanvasClick);
            canvas.addEventListener('mousemove', handleCanvasMouseMove);
            canvas.addEventListener('mouseout', handleCanvasMouseOut);

            loadWebSocket(); // Load WebSocket
            checkAdminMode(); // Check admin mode

            observeColorChanges(); // Start observing CSS variable changes

            // Initial drawing
            drawCircleAndLines();

            // Show the rotor after 300 ms
            setTimeout(() => {
                document.getElementById('containerRotator').classList.add('visible');
            }, 300);
        }

        // Load jQuery and execute the main function
        loadScript(JQUERY_URL, main);

    })();
})();
