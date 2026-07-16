@echo off
cd /d F:\projects\MESHX1
echo Starting local server...
echo Open this URL on LAN devices: http://%COMPUTERNAME%:8080/geofence_demo.html
python -m http.server 8080
pause