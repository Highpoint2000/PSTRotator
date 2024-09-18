# PST Rotator Plugin for [FM-DX-Webserver](https://github.com/NoobishSVK/fm-dx-webserver)

This plugin provides a graphical azimuth display (rotor view) with interactive control for the FM-DX web server.

![image](https://github.com/user-attachments/assets/d2ea5255-c144-45da-ab23-2b4bbd5ab518)

### Version 2.3b (only works from webserver version 1.2.8.1 !!!)

- Only view mode can be configured on the server side (complete blocking of the control!)

## Installation notes:

1. [Download]([https://github.com/Highpoint2000/PSTRotator/releases]) the last repository as a zip
2. Unpack all files into the web server plugins folder (..fm-dx-webserver-main\plugins\PSTRotator)
3. Stop or close the fm-dx-webserver
4. Enable the web server function in the [PSTRotator (AZ) software](https://www.pstrotator.com/)
5. Start/Restart the fm-dx-webserver with "npm run webserver" on node.js console, check the console informations
6. Activate the PSTRotator plugin in the settings
7. Stop or close the fm-dx-webserver
8. Configure personal settings in the automatically created configPlugin.json (in the specific plugin folder!)
	- Edit the line "PSTRotatorUrl: 'http://127.0.0.1:80';" in the pstrotator_server.js and enter the IP:Port of your PST Rotator web server
9. Start/Restart the fm-dx-webserver with "npm run webserver" on node.js console, check the console informations

## Configuration options:

The following variables can be changed in the configPlugin.json:

	PSTRotatorUrl: 'http://127.0.0.1:80', 	// Base URL for the PST Rotator software
	port: 3000, 				// Port for the internal CORS Proxy (default: 3000)
	RotorLimitLineLength: 0,		// Set the length of the line (default: 67, none: 0)
   	RotorLimitLineAngle: 129, 		// Set the angle of the line (e.g., 180)
	RotorLimitLineColor:'#808080', 		// Set the color for the additional line (default: #808080)

## Notes: 

To use the plugin effectively, you need a remote-capable rotor and the [PSTRotator (AZ) software](https://www.pstrotator.com/), which provides a web server. Admins can move the rotor by clicking on the degree ring or in the middle (manual input). The control can also be released to visitors using the on/off lock.
A gray line that marks the rotor limit can also be defined in the header of the client script. If you don't want this, set the variable to 0.

Users of the [RDS-Logger plugin](https://github.com/Highpoint2000/webserver-logger) please install version 1.3h or higher!

## History:

### Version 2.3a (only works from webserver version 1.2.8.1 !!!)

- Adaptation of the web socket /extra to /data_plugins, index.js update is no longer needed from now on!

### Version 2.3 (only works from webserver version 1.2.8 !!!)

- New notification design (Toast Notification)

### Version 2.2 (only works from webserver version 1.2.6 !!!)

- Fixed configuration is now stored in configPlugin.json

### Version 2.1 (only works from webserver version 1.2.6 !!!)

- Bugfixing
- Possibility to publicly release the rotor control added (lock on/off)

### Version 2.0 (only works from webserver version 1.2.6 !!!)

- Using the webserver for PSTRotator communication (There were crashes when using TCP!)
- Rotor is now on the left side (Weather plugin no longer needs to be moved!)
- Rotor display and control on mobile devices
- The rotor limit is shown by a gray line
- Manual degree entry 
- Authenticated Tune users can control the rotor 

### Version 1.4 (only works from webserver version 1.2.6 !!!)

- using the TCP protocol for PSTRotator communication
- new layout


### Version 1.3 (only works from webserver version 1.2.6 !!!)

- simplified installation
- checking and automatic installation of required node.js modules
- interactive control by clicking on the desired number of degrees (only for admins!)

### Version 1.2 (only works from webserver version 1.2.6 !!!)

- Bidirectional communication via own websocket channel (no port forwarding is needed!)

### Version 1.1 (only works with webserver version 1.2.5 !!!)

- theme-specific design
- visually improved messages in the node.js console

### Version 1.0 (only works with webserver version 1.2.5 !!!)

This plugin provides a graphical azimuth representation (rotor view) for the FM-DX web server.
