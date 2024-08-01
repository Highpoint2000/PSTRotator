# PST Rotator Plugin for [FM-DX-Webserver](https://github.com/NoobishSVK/fm-dx-webserver)

This plugin provides a graphical azimuth representation (rotor view) for the FM-DX web server.

![image](https://github.com/user-attachments/assets/fd030189-c855-4303-94fc-ca3df8946c8d)

## Version 1.2 (only works with webserver version 1.2.6 !!!)

- Bidirectional communication via own websocket channel (no port forwarding is needed!)

## Installation notes:

1. [Download]([https://github.com/Highpoint2000/PSTRotator/releases]) the last repository as a zip
3. Unpack plugins directory (PSTRotator.js and the PSTRotator folder) into the web server plugins folder (..fm-dx-webserver-main\plugins)
4. Unpack server directory (pstrotator_server.js and index_x.x.x.js) into the web server folder (..fm-dx-webserver-main\server)
5. rename the version that matches the web server: \server\index_x.x.x.js to index.js 
6. npm install (-g) jsdom
7. Enable the web server in the [PSTRotator (AZ) software](https://www.pstrotator.com/)
8. Edit the line "const PSTRotatorUrl = 'http://127.0.0.1:80';" in the pstrotator_server.js and enter the IP:Port of your PST Rotator web server
9. Edit the line "const externalWsUrl = 'ws://127.0.0.1:8080/extra"; in the pstrotator_server.js and enter the Port of your FM-DX webserver
10. Start/Restart the fm-dx-webserver with "npm run webserver" on node.js console, check the console informations
11. Activate the PSTRotator plugin it in the settings, check the browser console informations 

## Notes: 

In order to use the plugin sensibly, you need a remote-capable rotor and the [PSTRotator (AZ) software](https://www.pstrotator.com/), which provides a web server. There are currently complications with the weather plugin because it is located directly above the rotor display. If you still don't want to do without it, you should adapt the following lines in frontend.js (weather plugin script):
![image](https://github.com/user-attachments/assets/7e27a78f-cc59-4d1e-9a0b-cc93a6a18139)
This will move the weather plugin a little to the left and no longer overlay the rotor.

Users of the [RDS-Logger plugin](https://github.com/Highpoint2000/webserver-logger) please install version 1.3h or higher!

## History: 

## Version 1.1 (only works with webserver version 1.2.5 !!!)

- theme-specific design
- visually improved messages in the node.js console

### Version 1.0 (only works with webserver version 1.2.5 !!!)

This plugin provides a graphical azimuth representation (rotor view) for the FM-DX web server.
