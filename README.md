# PST Rotator Plugin for [FM-DX-Webserver](https://github.com/NoobishSVK/fm-dx-webserver)

This plugin provides a graphical azimuth display (rotor view) with interactive control for the FM-DX web server.

![image](https://github.com/user-attachments/assets/d5f9bcdd-cb5e-4767-903e-e4d30c907e31)


## Version 2.4b

- Admin error when logging in with the local IP fixed
- Fixed an error when controlling as an admin outside the unlock time
- Updated plugin info now in the web server setup

## Installation notes:

1. [Download]([https://github.com/Highpoint2000/PSTRotator/releases]) the last repository as a zip
2. Unpack all files into the web server plugins folder (..fm-dx-webserver-main\plugins\PSTRotator)
3. Stop or close the fm-dx-webserver
4. Enable the web server function in the [PSTRotator (AZ) software](https://www.pstrotator.com/) ---> The plugin only works with the AZ version of the PST Rotator software!)
5. Start/Restart the fm-dx-webserver with "npm run webserver" on node.js console, check the console informations
6. Activate the PSTRotator plugin in the settings
7. Stop or close the fm-dx-webserver
8. Configure your personal settings in the automatically created pstrotator.json (in the folder: ../fm-dx-webserver-main/plugins_configs)
	- Edit the line "PSTRotatorUrl: 'http://127.0.0.1:80';" and enter the IP:Port of your PST Rotator web server
9. Start/Restart the fm-dx-webserver with "npm run webserver" on node.js console, check the console informations

## Configuration options:

The following variables can be changed in the configPlugin.json:

	PSTRotatorUrl: 'http://127.0.0.1:80', 	// Base URL for the PST Rotator software
	port: 3000, 				// Port for the internal CORS Proxy (default: 3000)
	RotorLimitLineLength: 0,		// Set the length of the line (default: 67, none: 0)
   	RotorLimitLineAngle: 129, 		// Set the angle of the line (e.g., 180)
	RotorLimitLineColor:'#808080', 		// Set the color for the additional line (default: #808080)
	lockStartTime: '',                      // Start time for locking in HH:MM format (empty means no locking / 00:00 = 24h lock)
    lockEndTime: ''                         // End time for locking in HH:MM format (empty means no locking) / 00:00 = 24h lock)

	/// ES FOLLOW OPTIONS ///

	ESfollowOnStart: false,			// Set true or false for automatic start ES follow mode
	LAST_ALERT_MINUTES: 15,			// Enter the time in minutes for processing the last message when starts the server (default is 15)
	FMLIST_OMID:''				// Set your OMID to use the ES follow mode

## Notes: 

To use the plugin effectively, you need a remote-capable rotor and the [PSTRotator (AZ) software](https://www.pstrotator.com/ ---> The plugin only works with the AZ version of the PST Rotator software!), which provides a web server. Admins can move the rotor by clicking on the degree ring or in the middle (manual input). A gray line that marks the rotor limit can also be defined in the header of the client script. If you don't want this, set the variable to 0. Using the variables lockStartTime and lockEndTime, the use of the rotor can be locked and unlocked in a time-controlled manner. To using the ES Follow Mode, you must enable ES email notifications in FMLIST. You must also enter your OMID in the plugin's configuration settings. After activating the plugin as an admin using the ES Follow button, it checks every minute for notifications for the location and automatically aligns the rotor to the received azimuth value.


Users of the [RDS-Logger plugin](https://github.com/Highpoint2000/webserver-logger) please install version 1.3h or higher!

<details>
   <summary>History</summary>
   
   
### Version 2.4a

- Important security vulnerability for admin manipulation closed

### Version 2.4

- ES alarms can automatically control the rotor
- Lock mode has been revised


### Version 2.3e

- Minor adjustment for mobile design
- Audio issue fixed

### Version 2.3d

- Rotor can now be controlled in admin mode even during the lock time

### Version 2.3c

- rotor.png copied to /web/images for Linux compatibility
- Daily update check for admin
- Only the view mode has been removed and an admin lock timer has been set up

### Version 2.3b 

- configPlugin.json is moved to ../fm-dx-webserver-main/plugins_configs/pstrotator.json
- Only view mode can be configured on the server side (complete blocking of the control!)

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
