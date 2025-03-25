(() => {
///////////////////////////////////////////////////////////////////
///                                                             ///
///  PST ROTATOR CLIENT SCRIPT FOR FM-DX-WEBSERVER (V2.3e)      ///
///                                                             ///
///  by Highpoint                        last update: 25.03.25  ///
///                                                             ///
///  https://github.com/Highpoint2000/PSTRotator                ///
///                                                             ///
///////////////////////////////////////////////////////////////////

const RotorLimitLineLength = 67; 		// This value is automatically updated via the config file
const RotorLimitLineAngle = 129; 		// This value is automatically updated via the config file
const RotorLimitLineColor = '#808080'; 	// This value is automatically updated via the config file
const updateInfo = true; 				// Enable or disable version check	

////////////////////////////////////////////////////////////////////

const plugin_version = '2.3e'; 			// Plugin Version
const plugin_path = 'https://raw.githubusercontent.com/highpoint2000/PSTRotator/';
const plugin_JSfile = 'main/plugins/PSTRotator/pstrotator.js'
const plugin_name = 'PST Rotator';

let isTuneAuthenticated;
const PluginUpdateKey = `${plugin_name}_lastUpdateNotification`; // Unique key for localStorage

setTimeout(loadPSTRotator, 500);
function loadPSTRotator() {
	
		// Delay the execution by 500 milliseconds
		setTimeout(() => {
			
			
		  // Function to check if the notification was shown today
  function shouldShowNotification() {
    const lastNotificationDate = localStorage.getItem(PluginUpdateKey);
    const today = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format

    if (lastNotificationDate === today) {
      return false; // Notification already shown today
    }
    // Update the date in localStorage to today
    localStorage.setItem(PluginUpdateKey, today);
    return true;
  }

  // Function to check plugin version
  function checkPluginVersion() {
    // Fetch and evaluate the plugin script
    fetch(`${plugin_path}${plugin_JSfile}`)
      .then(response => response.text())
      .then(script => {
        // Search for plugin_version in the external script
        const pluginVersionMatch = script.match(/const plugin_version = '([\d.]+[a-z]*)?';/);
        if (!pluginVersionMatch) {
          console.error(`${plugin_name}: Plugin version could not be found`);
          return;
        }

        const externalPluginVersion = pluginVersionMatch[1];

        // Function to compare versions
		function compareVersions(local, remote) {
			const parseVersion = (version) =>
				version.split(/(\d+|[a-z]+)/i).filter(Boolean).map((part) => (isNaN(part) ? part : parseInt(part, 10)));

			const localParts = parseVersion(local);
			const remoteParts = parseVersion(remote);

			for (let i = 0; i < Math.max(localParts.length, remoteParts.length); i++) {
				const localPart = localParts[i] || 0; // Default to 0 if part is missing
				const remotePart = remoteParts[i] || 0;

				if (typeof localPart === 'number' && typeof remotePart === 'number') {
					if (localPart > remotePart) return 1;
					if (localPart < remotePart) return -1;
				} else if (typeof localPart === 'string' && typeof remotePart === 'string') {
					// Lexicographical comparison for strings
					if (localPart > remotePart) return 1;
					if (localPart < remotePart) return -1;
				} else {
					// Numeric parts are "less than" string parts (e.g., `3.5` < `3.5a`)
					return typeof localPart === 'number' ? -1 : 1;
				}
			}

			return 0; // Versions are equal
		}


        // Check version and show notification if needed
        const comparisonResult = compareVersions(plugin_version, externalPluginVersion);
        if (comparisonResult === 1) {
          // Local version is newer than the external version
          console.log(`${plugin_name}: The local version is newer than the plugin version.`);
        } else if (comparisonResult === -1) {
          // External version is newer and notification should be shown
          if (shouldShowNotification()) {
            console.log(`${plugin_name}: Plugin update available: ${plugin_version} -> ${externalPluginVersion}`);
			sendToast('warning important', `${plugin_name}`, `Update available:<br>${plugin_version} -> ${externalPluginVersion}`, false, false);
            }
        } else {
          // Versions are the same
          console.log(`${plugin_name}: The local version matches the plugin version.`);
        }
      })
      .catch(error => {
        console.error(`${plugin_name}: Error fetching the plugin script:`, error);
      });
	}
			

        // Global variable to store the IP address
        let ipAddress;

        // Flag to indicate whether authentication is successful
        let isTuneAuthenticated;
		let isAdminLoggedIn;
		let isTuneLoggedIn;
		let isLockAuthenticated; 

        // data_pluginsct WebserverURL and WebserverPORT from the current page URL
        const currentURL = new URL(window.location.href);
        const WebserverURL = currentURL.hostname;
        const WebserverPath = currentURL.pathname.replace(/setup/g, '');
        let WebserverPORT = currentURL.port || (currentURL.protocol === 'https:' ? '443' : '80'); // Default ports if not specified

        // Determine WebSocket protocol and port
        const protocol = currentURL.protocol === 'https:' ? 'wss:' : 'ws:'; // Determine WebSocket protocol
        const WebsocketPORT = WebserverPORT; // Use the same port as HTTP/HTTPS
        const WEBSOCKET_URL = `${protocol}//${WebserverURL}:${WebsocketPORT}${WebserverPath}data_plugins`; // WebSocket URL with /data_plugins

        // Configuration variables
        const JQUERY_VERSION = '3.6.0'; // Version of jQuery to use
        const JQUERY_URL = `https://code.jquery.com/jquery-${JQUERY_VERSION}.min.js`; // URL for jQuery
        const IMAGE_URL = `http://${WebserverURL}:${WebserverPORT}${WebserverPath}images/rotor.png`; // URL for background image

        let ctx; // Canvas context
        let x, y; // Center coordinates of the canvas
        const radius = 23;
        let lineAngle = 26;
        const lineLength = 67;
        let canvas; // Canvas element
        let tooltip; // Tooltip element
        let ws; // WebSocket instance

        // Function to fetch the client's IP address
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

        // Function to check if the user is logged in as an administrator
        function checkAdminMode() {
            const bodyText = document.body.textContent || document.body.innerText;
            isAdminLoggedIn = bodyText.includes("You are logged in as an administrator.") || bodyText.includes("You are logged in as an adminstrator.");
            isTuneLoggedIn = bodyText.includes("You are logged in and can control the receiver.");

            if (isAdminLoggedIn) {
                console.log(`Admin mode found. PSTRotator Plugin Authentication successful.`);
                isTuneAuthenticated = true;
            } else if (isTuneLoggedIn) {
                console.log(`Tune mode found. PSTRotator Plugin Authentication successful.`);
                isTuneAuthenticated = true;
            }
        }

        const PSTRotatorPlugin = (() => {
            // Add CSS styles
            const style = document.createElement('style');
            style.textContent = `
                #signal-canvas {
                    width: 82%;
                    margin-left: 200px;
                    margin-top: 0px;
                    height: 170px;
                }
                #containerRotator {
                    position: relative;
                    margin-top: 0px;
                    opacity: 0; /* Initially hidden */
                    transition: opacity 0.5s ease-in-out; /* Smooth fade-in effect */
                    margin-left: 10px; /* Default margin-left for screens wider than 768px */
                    height: 0px;
                    width: auto;
                }
                /* Media Query for screens narrower than 900px */
                @media (max-height: 900px) {
                    #containerRotator {
                        position: relative;
                        margin-top: 50px;
                        opacity: 0; /* Initially hidden */
                        transition: opacity 0.5s ease-in-out; /* Smooth fade-in effect */
                        margin-left: 10px; /* Default margin-left for screens wider than 768px */
                        height: auto;
                        width: auto;
                    }
                }

                /* Media Query for screens narrower than 768px */
                @media (max-width: 768px) {
                    #containerRotator {
                        margin-top: 240px;
                        height: 110px;
                        width: 240px; /* Ensure the width is set for centering */
                        margin-left: auto;
                        margin-right: auto; /* Center the element horizontally */
                    }
                }
                #containerRotator.visible {
                    opacity: 1; /* Visible after fade-in */
                }
                #backgroundRotator {
                    position: absolute;
                    margin-top: -152px;
                    width: 200px;
                    height: 200px;
                }

                /* Media Query for screens narrower than 768px */
                @media (max-width: 768px) {
                    #backgroundRotator {
                        width: 270px;
                        height: 270px;
                    }
                }

                #backgroundRotator img {
                    height: 90%;
                    margin-top: -23px;
                    margin-left: -4px;
                    object-fit: cover;
                }
                #CanvasRotator {
                    position: absolute;
                    top: -185px;
                    left: -13px;
                    display: block;
                }

                /* Media Query for screens narrower than 768px */
                @media (max-width: 768px) {
                    #CanvasRotator {
                        top: -188px;
                        left: -17px;
                        width: 270px;
                        height: 270px;
                    }
                }

                #innerCircle {
                    position: absolute;
                    top: -90px;
                    left: 85px;
                    transform: translate(-50%, -50%);
                    width: 105px;
                    height: 105px;
                    border-radius: 50%;
                    cursor: pointer;
                }    
                /* Media Query for screens narrower than 768px */
                @media (max-width: 768px) {
                    #innerCircle {
                        top: -60px;
                        left: 120px;
                        width: 130px;
                        height: 130px;
                    }
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
                /* Media Query for screens narrower than 768px */
                @media (max-width: 768px) {
                    #tooltip {
                        top: 0px;
                        left: 0px;
                    }
                }
                #lockButton {
                    position: relative;
                    top: -20px;
                    right: -160px;
                    width: 20px;
                    height: 30px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    cursor: pointer;
                }
				/* Media Query for screens narrower than 768px */
                @media (max-width: 768px) {
                    #lockButton {
                        top: 40px;
                        left: 220px;
                    }
                }
                #lockButton.locked::before {
					filter: hue-rotate(320deg);
                    content: '🔒';
                    font-size: 20px;
                }				
                #lockButton.unlocked::before {
					filter: hue-rotate(320deg);
                    content: '🔓';
                    font-size: 20px;
                }
            `;
            document.head.appendChild(style);

            // Function to add HTML elements
            function addHtmlElements() {
                // Find the existing canvas container and the signal-canvas element
                const canvasContainer = document.querySelector('.canvas-container.hide-phone');
                const signalCanvas = document.getElementById('signal-canvas');

                if (canvasContainer && signalCanvas) {
                    console.log('Found canvas-container and #signal-canvas element.');

                    // Remove hide-phone from canvas-container
                    canvasContainer.classList.remove('hide-phone');

                    // Create a new div for the signal-canvas with the hide-phone class
                    const hideCanvasContainer = document.querySelector(".canvas-container");
                    hideCanvasContainer.className = 'canvas-container hide-phone';
                    hideCanvasContainer.appendChild(signalCanvas);

                    // Insert the new hide-canvas-container before the existing containerRotator if it exists
                    if (document.getElementById('containerRotator')) {
                        canvasContainer.insertAdjacentElement('beforebegin', hideCanvasContainer);
                    } else {
                        // If containerRotator does not exist, just replace the existing canvasContainer
                        canvasContainer.parentNode.replaceChild(hideCanvasContainer, canvasContainer);
                    }

                    console.log('HTML elements added and updated successfully.');

                    // Check if the containerRotator already exists
                    if (!document.getElementById('containerRotator')) {
                        const containerRotator = document.createElement('div');
                        containerRotator.id = 'containerRotator';
							containerRotator.innerHTML = `
								<div id="backgroundRotator">
									<img src="${IMAGE_URL}" alt="Background Image">
								</div>
								<canvas id="CanvasRotator" width="200" height="200"></canvas>
								<div id="innerCircle" title="Plugin Version: ${plugin_version}">
									<div id="lockIcon" class="lock-closed"></div>
								</div>
								<div id="lockButton" class="locked"></div>
                        `;
						

                        // Insert the new containerRotator after the newly created hide-canvas-container element
                        hideCanvasContainer.insertAdjacentElement('afterend', containerRotator);
                        console.log('containerRotator added successfully.');
                        // Set parent container styles to allow side by side placement
                        containerRotator.style.display = 'flex';
                        containerRotator.style.alignItems = 'flex-start';
                    }

                    // Create and append the tooltip element
                    tooltip = document.createElement('div');
                    tooltip.id = 'tooltip';
                    document.body.appendChild(tooltip);
                } else {
                    console.error('Required elements not found.');
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

            // Function to draw the circle and lines on the canvas
            function drawCircleAndLines() {
                const color = getCurrentColor();
                const grayColor = '#808080'; // Gray color for the additional line
                if (!ctx) return; // Check if ctx is defined

                ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

                // Additional gray line (drawn first, so it appears under other lines)
                const RotorLimitLineStartX = x + radius * Math.cos((RotorLimitLineAngle - 90) * Math.PI / 180);
                const RotorLimitLineStartY = y + radius * Math.sin((RotorLimitLineAngle - 90) * Math.PI / 180);
                const RotorLimitLineEndX = x + (radius + RotorLimitLineLength) * Math.cos((RotorLimitLineAngle - 90) * Math.PI / 180);
                const RotorLimitLineEndY = y + (radius + RotorLimitLineLength) * Math.sin((RotorLimitLineAngle - 90) * Math.PI / 180);

                ctx.beginPath();
                ctx.moveTo(RotorLimitLineStartX, RotorLimitLineStartY);
                ctx.lineTo(RotorLimitLineEndX, RotorLimitLineEndY);
                ctx.strokeStyle = grayColor; // Use gray color for the additional line
                ctx.lineWidth = 1; // Thin line
                ctx.stroke();
                ctx.closePath();

                // Draw the circle
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, 2 * Math.PI);
                ctx.strokeStyle = color;
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.closePath();

                // Draw the main line
                const lineStartX = x + radius * Math.cos((lineAngle) * Math.PI / 180);
                const lineStartY = y + radius * Math.sin((lineAngle) * Math.PI / 180);
                const lineEndX = x + (radius + lineLength) * Math.cos((lineAngle) * Math.PI / 180);
                const lineEndY = y + (radius + lineLength) * Math.sin((lineAngle) * Math.PI / 180);

                ctx.beginPath();
                ctx.moveTo(lineStartX, lineStartY);
                ctx.lineTo(lineEndX, lineEndY);
                ctx.strokeStyle = color;
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.closePath();

                // Draw the text in the center
                ctx.font = 'bold 16px Titillium Web, Calibri, sans-serif';
                ctx.fillStyle = color;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText((lineAngle + 90) % 360 + '°', x, y);
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
						lock: isLockAuthenticated,
                        source: ipAddress
                    });
                    ws.send(message);
                    console.log('Sent position:', message);
                } else {
                    console.error('WebSocket is not open. Unable to send position.');
                }
            }
			
			// Function to send data via WebSocket
            function sendLockStatus() {
                if (ws && ws.readyState === WebSocket.OPEN) {
                    const message = JSON.stringify({
                        type: 'Rotor',
						lock: isLockAuthenticated,
                        source: ipAddress
                    });
                    ws.send(message);
                    console.log('Sent lock status:', message);
                } else {
                    console.error('WebSocket is not open. Unable to send position.');
                }
            }

            // Function to handle click on the canvas
            function handleCanvasClick(event) {
                if (!isTuneAuthenticated && isLockAuthenticated) {
					sendToast('warning', 'PST Rotator', 'You must be authenticated to use the PSTRotator feature!', false, false);
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

            // Function to handle click on the inner circle
            function handleInnerCircleClick() {
                if (!isTuneAuthenticated && isLockAuthenticated) {
					sendToast('warning', 'PST Rotator', 'You must be authenticated to use the PSTRotator feature!', false, false);
                    return;
                }

                // Prompt the user to enter the bearing value
                const bearing = prompt("Enter the bearing value (0-359 degrees):", "");

                // Validate the input and send the position
                if (bearing !== null) {
                    const position = parseInt(bearing, 10);

                    if (!isNaN(position) && position >= 0 && position <= 359) {
                        sendPosition(position);
                    } else {
						sendToast('warning', 'PST Rotator', 'Invalid bearing value. Please enter a number between 0 and 359!', false, false);
                    }
                }
            }

            // Function to handle mouse move over the canvas
            function handleCanvasMouseMove(event) {
                if (!isTuneAuthenticated && isLockAuthenticated) {
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

            // data_pluginsct position and lock from JSON data
            const position = parseFloat(data.value);
            const lock = data.lock;

            // Check if lock status is received and differs from current status
            if (lock !== undefined && lock !== isLockAuthenticated) {
				console.log(lock);
                isLockAuthenticated = lock; // Update isLockAuthenticated
                updateLockButtonState(); // Update the lock button UI based on the new state
                console.log(`Lock state updated to: ${isLockAuthenticated}`);
            }

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

function toggleAuthentication() {
    if (isAdminLoggedIn) {
        isLockAuthenticated = !isLockAuthenticated;
        updateLockButtonState(); // Call the function to update lock button UI
        sendLockStatus(); // Send the new lock status over WebSocket
        console.log(`Lock state set to: ${isLockAuthenticated}`);
    } else {
        alert("You must be authenticated to use the PSTRotator feature.");
    }
}

// Function to update the lock button state
function updateLockButtonState() {
    const lockButton = document.getElementById('lockButton');
    if (isLockAuthenticated) {
        lockButton.classList.remove('unlocked');
        lockButton.classList.add('locked');
    } else {
        lockButton.classList.remove('locked');
        lockButton.classList.add('unlocked');
    }
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

                // Add click event listener to the inner circle
                document.getElementById('innerCircle').addEventListener('click', handleInnerCircleClick);

                // Add click event listener to the lock button
                document.getElementById('lockButton').addEventListener('click', toggleAuthentication);

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
		
		setTimeout(() => {
		// Execute the plugin version check if updateInfo is true and admin ist logged on
		if (updateInfo && isTuneAuthenticated) {
			checkPluginVersion();
			}
		}, 200);	
		
    }, 500); // End of the setTimeout function with a 500 ms delay
				
	}
})();