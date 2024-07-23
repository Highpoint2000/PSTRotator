# PST Rotator Plugin for [FM-DX-Webserver](https://github.com/NoobishSVK/fm-dx-webserver)

![image](https://github.com/user-attachments/assets/4f29aba0-92ec-4a84-8b32-7f2a8a9b3d89)

## Version 1.0 

## Installation notes:

1. [Download]([https://github.com/Highpoint2000/PSTRotator/releases]) the last repository as a zip
2. Unpack the PSTRotator.js and the PSTRotator folder with the pstrotator_client.js into the web server plugins folder (..fm-dx-webserver-main\plugins)
3. Unpack the pstrotator_server.js from the server folder into the web server folder (..fm-dx-webserver-main\server)
4. Add the line: "require('./pstrotator_server');" into ..fm-dx-webserver-main\server\index.js 
   ![image](https://github.com/user-attachments/assets/d0336049-5dfa-4238-9d25-506c3188e6f1)
5. run npm install
6. Set up port forwarding for port 3000 to the web server
7. 
8. Restart the server
9. Activate the plugin it in the settings

This plugin provides email Alerts for DX Receiption with the FM-DX web server.

## Notes: 

To use the plugin, you must enter a valid email address in the script header. You also have the option of entering a notification interval in minutes (minimum is 5 minutes) as well as a distance in km (minimum is 150 km) from when the plugin should notify you. The plugin can only be activated as an authenticated user or as an admin. After logging in, you can send a test email to the registered address by pressing and holding the DX-Alert button. Since this is a purely client-related application, the browser must not be closed during the indication! The plugin is a useful addition to the [scanner plugin](https://github.com/Highpoint2000/webserver-scanner) so that you are always informed if the reception conditions change positively!

Please note:

- The plugin does not log receptions. Only the first station found, above the entered kilometer limit and time interval, will be sent with detailed information as an indication of overreach!
- In order not to receive too many emails (SPAM) and still not miss any DX receptions, it is recommended to set the time limit to 60 minutes and higher
- If you activate the alert button, you will also receive an email if another user of the web server receives DX stations while zapping

## History: 

## Version 1.0 (only works from web server version 1.2.3 !!!)

- email Alert for DX Receiption
