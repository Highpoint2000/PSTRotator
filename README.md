# PST Rotator Plugin for [FM-DX-Webserver](https://github.com/NoobishSVK/fm-dx-webserver)

![image](https://github.com/user-attachments/assets/dffecdad-8a67-496f-a88c-f97db8ec5a89)


## Version 1.0 

This plugin provides a graphical azimuth representation (rotor view) for the FM-DX web server.

## Installation notes:

1. [Download]([https://github.com/Highpoint2000/PSTRotator/releases]) the last repository as a zip
3. Unpack the PSTRotator.js and the PSTRotator folder with the pstrotator_client.js into the web server plugins folder (..fm-dx-webserver-main\plugins)
4. Download the pstrotator_server.js from the [server folder](https://github.com/Highpoint2000/PSTRotator/tree/main/server)   into the web server folder (..fm-dx-webserver-main\server)
5. Add the line: "require('./pstrotator_server');" into ..fm-dx-webserver-main\server\index.js 
   ![image](https://github.com/user-attachments/assets/d0336049-5dfa-4238-9d25-506c3188e6f1)
6. run "npm install" on node.js console
7. Enable the web server in the [PSTRotator (AZ) software](https://www.pstrotator.com/)
8. Edit the line "const PSTRotatorUrl = 'http://127.0.0.1:80';" in the pstrotator_server.js and enter the IP:Port of your PST Rotator web server
9. Set up port forwarding for TCP port 3000 on your firewall/router for access to the websocket/cors proxy on your fm-dx-webserver
10. Start/Restart the fm-dx-webserver (npm run webserver), check the console informations
11. Activate the PSTRotator plugin it in the settings, check the browser console informations 


## Notes: 

In order to use the plugin sensibly, you need a remote-capable rotor and the [PSTRotator (AZ) software](https://www.pstrotator.com/), which provides a web server. There are currently complications with the weather plugin because it is located directly above the rotor display. If you still don't want to do without it, you should adapt the following lines in frontend.js (weather plugin script):
![image](https://github.com/user-attachments/assets/7e27a78f-cc59-4d1e-9a0b-cc93a6a18139)
This will move the weather plugin a little to the left and no longer overlay the rotor.


