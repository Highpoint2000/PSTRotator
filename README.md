# PST Rotator Plugin for [FM-DX-Webserver](https://github.com/NoobishSVK/fm-dx-webserver)

This plugin provides a graphical azimuth display (rotor view) with interactive control for the FM-DX web server.

![image](https://github.com/user-attachments/assets/f86ceafc-af73-4156-acce-61f1cc26e599)


## Version 1.4 (only works from webserver version 1.2.6 !!!)

- using the TCP protocol for PSTRotator communication
- new layout


## Installation notes:

1. [Download]([https://github.com/Highpoint2000/PSTRotator/releases]) the last repository as a zip
2. Unpack all files into the web server plugins folder (..fm-dx-webserver-main\plugins\PSTRotator)
3. copy, rename and overwrite the index.js version that matches the web server: \server\index_x.x.x.js to ..fm-dx-webserver-main\server\index.js 
4. Enable the web server function in the [PSTRotator (AZ) software](https://www.pstrotator.com/)
5. Edit the line "const PSTRotatorUrl = 'http://127.0.0.1:80';" in the pstrotator_server.js and enter the IP:Port of your PST Rotator web server
6. Start/Restart the fm-dx-webserver with "npm run webserver" on node.js console, check the console informations
7. Activate the PSTRotator plugin it in the settings, check the browser console informations 

## Notes: 

In order to use the plugin sensibly, you need a remote-capable rotor and the [PSTRotator (AZ) software](https://www.pstrotator.com/), which provides a web server. There are currently complications with the weather plugin because it is located directly above the rotor display. If you still don't want to do without it, you should adapt the following lines in frontend.js (weather plugin script):
![image](https://github.com/user-attachments/assets/7e27a78f-cc59-4d1e-9a0b-cc93a6a18139)
This will move the weather plugin a little to the left and no longer overlay the rotor.

Users of the [RDS-Logger plugin](https://github.com/Highpoint2000/webserver-logger) please install version 1.3h or higher!

## History: 

## Version 1.3 (only works from webserver version 1.2.6 !!!)

- simplified installation
- checking and automatic installation of required node.js modules
- interactive control by clicking on the desired number of degrees (only for admins!)

## Version 1.2 (only works from webserver version 1.2.6 !!!)

- Bidirectional communication via own websocket channel (no port forwarding is needed!)

## Version 1.1 (only works with webserver version 1.2.5 !!!)

- theme-specific design
- visually improved messages in the node.js console

### Version 1.0 (only works with webserver version 1.2.5 !!!)

This plugin provides a graphical azimuth representation (rotor view) for the FM-DX web server.
