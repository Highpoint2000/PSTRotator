# PST Rotator Plugin for [FM-DX-Webserver](https://github.com/NoobishSVK/fm-dx-webserver)

This plugin provides a graphical azimuth display (rotor view) with interactive control for the FM-DX web server.

![image](https://github.com/user-attachments/assets/d2ea5255-c144-45da-ab23-2b4bbd5ab518)



## Version 2.1 BETA (only works from webserver version 1.2.6 !!!)

- Bugfixing
- Possibility to publicly release the rotor control added (lock on/off)

## Installation notes:

1. [Download]([https://github.com/Highpoint2000/PSTRotator/releases]) the last repository as a zip
2. Unpack all files into the web server plugins folder (..fm-dx-webserver-main\plugins\PSTRotator)
3. copy, rename and overwrite the index.js version that matches the web server: \server\index_x.x.x.js to ..fm-dx-webserver-main\server\index.js 
4. Enable the web server function in the [PSTRotator (AZ) software](https://www.pstrotator.com/)
5. Edit the line "const PSTRotatorUrl = 'http://127.0.0.1:80';" in the pstrotator_server.js and enter the IP:Port of your PST Rotator web server
6. Start/Restart the fm-dx-webserver with "npm run webserver" on node.js console, check the console informations
7. Activate the PSTRotator plugin it in the settings, check the browser console informations 

## Notes: 

In order to use the plugin sensibly, you need a remote-capable rotor and the [PSTRotator (AZ) software](https://www.pstrotator.com/), which provides a web server. The rotor can be moved by clicking on the degree ring or in the middle (manual input).
A gray line can be defined in the header of the client script, which marks the rotor limit. 

Users of the [RDS-Logger plugin](https://github.com/Highpoint2000/webserver-logger) please install version 1.3h or higher!

## History:

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
