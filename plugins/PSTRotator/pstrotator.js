
(() => {
////////////////////////////////////////////////////////////////////
//                                                                //
//  PST ROTATOR CLIENT SCRIPT FOR FM-DX-WEBSERVER (V2.4b)         //
//                                                                //
//  by Highpoint                        last update: 12.06.25     //
//                                                                //
//  https://github.com/Highpoint2000/PSTRotator                   //
//                                                                //
////////////////////////////////////////////////////////////////////

const RotorLimitLineColor = '#808080';	// automatically updated - please do not touch!
const RotorLimitLineAngle = 129; // automatically updated - please do not touch!
const RotorLimitLineLength = 0; // automatically updated - please do not touch!

const pluginSetupOnlyNotify	= true;		
const CHECK_FOR_UPDATES 	= true;

const pluginVersion 	   = "2.4b";
const pluginName 		   = "PST Rotator";
const pluginHomepageUrl    = "https://github.com/Highpoint2000/PSTRotator/releases";
const pluginUpdateUrl 	   = "https://raw.githubusercontent.com/highpoint2000/PSTRotator/main/plugins/PSTRotator/pstrotator.js" + "?_=" + new Date().getTime();

const FOLLOW_PLUGIN_NAME   = 'ES Follow';

let isTuneAuthenticated;
let isAdminLoggedIn;
let isTuneLoggedIn;
let isLockAuthenticated;
let follow = false;  

setTimeout(loadPSTRotator, 1500);
function loadPSTRotator() {

/* =================================================================== *
 *  Update Notification                                               *
 * =================================================================== */
  
// Function to check for plugin updates (only runs on setup page if setupOnly is true)
function checkUpdate(setupOnly, pluginName, urlUpdateLink, urlFetchLink) {
  if (setupOnly && window.location.pathname !== '/setup') return;

  // Determine current plugin version from available globals
  const pluginVersionCheck =
    typeof pluginVersion !== 'undefined'
      ? pluginVersion
      : typeof PLUGIN_VERSION !== 'undefined'
        ? PLUGIN_VERSION
        : 'Unknown';

  // New fetchFirstLine version:
  async function fetchFirstLine() {
    try {
      const response = await fetch(urlFetchLink);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const text = await response.text();

      // Try to extract version from known patterns
      let match = text.match(
        /const\s+PLUGIN_VERSION\s*=\s*['"]([^'"]+)['"]/i
      );

      if (!match) {
        match = text.match(
          /const\s+pluginVersion\s*=\s*['"]([^'"]+)['"]/i
        );
      }

      if (!match) {
        match = text.match(
          /const\s+plugin_version\s*=\s*['"]([^'"]+)['"]/i
        );
      }

      if (match) {
        return match[1];
      }

      // Fallback: check first line of file
      const firstLine = text.split('\n')[0].trim();
      return /^\d/.test(firstLine) ? firstLine : "Unknown";
    } catch (error) {
      console.error(`[${pluginName}] Error fetching file:`, error);
      return null;
    }
  }

  // Compare versions and notify if there's an update
  fetchFirstLine().then(newVersion => {
    if (newVersion && newVersion !== pluginVersionCheck) {
      console.log(
        `[${pluginName}] There is a new version available: ${pluginVersionCheck} → ${newVersion}`
      );
      setupNotify(pluginVersionCheck, newVersion, pluginName, urlUpdateLink);
    }
  });

  // Show update link and red dot indicator in the setup UI
  function setupNotify(current, remote, pluginName, urlUpdateLink) {
    if (window.location.pathname !== '/setup') return;
    const pluginSettings = document.getElementById('plugin-settings');
    if (!pluginSettings) return;

    const linkHTML = `<a href="${urlUpdateLink}" target="_blank">[${pluginName}] Update available: ${current} → ${remote}</a><br>`;
    if (pluginSettings.textContent.trim() === 'No plugin settings are available.') {
      pluginSettings.innerHTML = linkHTML;
    } else {
      pluginSettings.innerHTML += ' ' + linkHTML;
    }

    // red dot in menu
    const updateIcon =
      document.querySelector('.wrapper-outer #navigation .sidenav-content .fa-puzzle-piece')
      || document.querySelector('.wrapper-outer .sidenav-content')
      || document.querySelector('.sidenav-content');

    if (updateIcon) {
      const redDot = document.createElement('span');
      redDot.style.cssText = `
        display: block;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background-color: #FE0830;
        margin-left: 82px;
        margin-top: -12px;
      `;
      updateIcon.appendChild(redDot);
    }
  }
}

if (CHECK_FOR_UPDATES) {
  checkUpdate(
    pluginSetupOnlyNotify,
    pluginName,
    pluginHomepageUrl,
    pluginUpdateUrl
  );
}

        // Global variable to store the IP address
        let ipAddress;

        // data_pluginsct WebserverURL and WebserverPORT from the current page URL
        const currentURL = new URL(window.location.href);
        const WebserverURL = currentURL.hostname;
        const WebserverPath = currentURL.pathname.replace(/setup/g, '');
        let WebserverPORT = currentURL.port || (currentURL.protocol === 'https:' ? '443' : '80');

        // Determine WebSocket protocol and port
        const protocol = currentURL.protocol === 'https:' ? 'wss:' : 'ws:';
        const WebsocketPORT = WebserverPORT;
        const WEBSOCKET_URL = `${protocol}//${WebserverURL}:${WebsocketPORT}${WebserverPath}data_plugins`;

        // Configuration variables
        const JQUERY_VERSION = '3.6.0';
        const JQUERY_URL = `https://code.jquery.com/jquery-${JQUERY_VERSION}.min.js`;
        const IMAGE_URL = `http://${WebserverURL}:${WebserverPORT}${WebserverPath}images/rotor.png`;

        let ctx;
        let x, y;
        const radius = 23;
        let lineAngle = 26;
        const lineLength = 67;
        let canvas;
        let tooltip;
        let ws;

// Function to fetch the client's IP address
async function fetchIpAddress() {
  const host = WebserverURL; 

  // 1) If host is already a plain IPv4 address, return it directly
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(host)) {
    return host;
  }

  // 2) Otherwise, resolve the domain via DNS-over-HTTPS (Google’s DNS API)
  try {
    const dnsRes = await fetch(`https://dns.google/resolve?name=${host}&type=A`);
    const dnsJson = await dnsRes.json();
    if (dnsJson.Answer && dnsJson.Answer.length) {
      // Find the first A-record
      const aRecord = dnsJson.Answer.find(r => r.type === 1);
      if (aRecord && aRecord.data) {
        return aRecord.data;  // e.g. "203.0.113.42"
      }
    }
  } catch (e) {
    console.warn('DNS resolution failed, will fall back:', e);
  }

  // 3) Optional fallback: get your public IP via ipify
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    const json = await res.json();
    return json.ip;
  } catch (e) {
    console.error('Public-IP lookup failed:', e);
  }

  // Final fallback if everything else failed
  return host;
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
		
// Function to update the follow button appearance based on `follow`
function updateFollowButtonState() {
  const btn = document.getElementById('ES-FOLLOW-on-off');
  if (!btn) return;
  btn.classList.toggle('active', follow);
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
								<div id="innerCircle" title="Plugin Version: ${pluginVersion}">
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

// Function to update the Follow button's state
        function updateFollowButtonState () {
            const btn = document.getElementById('ES-FOLLOW-on-off');
            if (!btn) return;
            btn.classList.toggle('active', follow);
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

       // Function to handle WebSocket messages
        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                if (data.type === 'Rotor') {
            // Skip messages von dir selbst
            if (data.source === ipAddress) return;

            // Handle Follow-Status **immer**, nicht nur bei Änderung
            if (typeof data.follow === 'boolean') {
                follow = data.follow;
                updateFollowButtonState();      // Klasse aktiv/inaktiv immer neu setzen
            }

                    const position = parseFloat(data.value);
                    const lock = data.lock;

                    if (lock !== undefined && lock !== isLockAuthenticated) {
                        isLockAuthenticated = lock;
                        updateLockButtonState();
                        console.log(`Lock state updated to: ${isLockAuthenticated}`);
                    }

                    if (isNaN(position)) {
                        console.error('Received position is not a valid number:', data.value);
                        return;
                    }

                    if (position >= 0 && position <= 360) {
                        lineAngle = position - 90;
                        drawCircleAndLines();
                    } else {
                        console.warn('Received position is out of range:', position);
                    }
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

                loadWebSocket(); // Load WebSocket
                checkAdminMode(); // Check admin mode

                observeColorChanges(); // Start observing CSS variable changes

                // Initial drawing
                drawCircleAndLines();

                // Show the rotor after 300 ms
                setTimeout(() => {
                    document.getElementById('containerRotator').classList.add('visible');
                }, 500);
            }

            // Load jQuery and execute the main function
            loadScript(JQUERY_URL, main);

        })();
		
// New function for sending the follow status via WebSocket
function sendFollow(isFollowing) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        const message = JSON.stringify({
            type: 'Rotor',
            follow: isFollowing,
            source: ipAddress
        });
        ws.send(message);
        console.log('Sent follow status:', message);
    } else {
        console.error('WebSocket is not open. Unable to send follow command');
    }
}

(function createFollowToggle(id) {
    // Observe the document for the plugin panel to become available
    const obs = new MutationObserver(() => {
        if (typeof addIconToPluginPanel === 'function') {
            obs.disconnect();
            // Add the follow icon to the plugin panel
            addIconToPluginPanel(
                id,
                FOLLOW_PLUGIN_NAME,
                'solid',
                'eye',
                'Toggle Rotor follow ES-Alert on/off'
            );

            // Observe again for the button element to appear in the DOM
            const btnObs = new MutationObserver(() => {
                const $btn = $(`#${id}`);
                if (!$btn.length) return;
                btnObs.disconnect();

                // Apply base styling classes
                $btn.addClass('hide-phone bg-color-2');

                // Initialization: disable follow mode if user is not authorized
                if (follow && !isAdminLoggedIn && !isTuneLoggedIn) {
                    follow = false;
                }
                // If follow mode is active, mark the button and notify server
                if (follow) {
                    $btn.addClass('active');
                    sendFollow(true);
                }
                updateFollowButtonState();

                let longPress = false,
                    timer;
                // Handle long-press to open the Azimuth map
                $btn.on('mousedown', () => {
                    longPress = false;
                    timer = setTimeout(() => {
                        longPress = true;
                        if (typeof openAzimuthMap === 'function') {
                            openAzimuthMap();
                        }
                    }, 300);
                });

                // Handle click/tap to toggle follow mode
                $btn.on('mouseup', () => {
                    clearTimeout(timer);
                    if (longPress) return;

                    // Only Admin or Tune users may toggle follow mode
                    if (!isAdminLoggedIn && !isTuneLoggedIn) {
                        sendToast(
                            'warning',
                            FOLLOW_PLUGIN_NAME,
                            'You must be logged in as an Admin or Tune user!',
                            false,
                            false
                        );
                        return;
                    }

                    // Toggle follow state and send the new status
                    follow = !follow;
                    sendFollow(follow);
                });

                // Cancel long-press timer if the pointer leaves the button
                $btn.on('mouseleave', () => clearTimeout(timer));
            });

            // Start observing for the button element
            btnObs.observe(document.body, { childList: true, subtree: true });
        }
    });

    // Start observing for the plugin panel
    obs.observe(document.body, { childList: true, subtree: true });

    // Inject CSS rules for hover and active states
    $('<style>')
        .prop('type', 'text/css')
        .html(`
            #${id}:hover { 
                color: var(--color-5); 
                filter: brightness(120%); 
            }
            #${id}.active { 
                background-color: var(--color-2) !important; 
                filter: brightness(120%); 
            }
        `)
        .appendTo('head');
})('ES-FOLLOW-on-off');

}

})();