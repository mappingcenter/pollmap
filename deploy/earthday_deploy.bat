rem Timestamp log
set logfile="C:\Logs\pollmap-earthday_deploy.log.txt"
echo. && echo ===== Earthday Pollmap Re-deploy Script ===== >> %logfile%
date/t >> %logfile%
time/t >> %logfile%

rmdir/s/q C:\inetpub\wwwroot\earthday
mkdir C:\inetpub\wwwroot\earthday
copy/y/v \\tsclient\C\Code\Javascript\EarthdayPollmap\deploy\index.html C:\inetpub\wwwroot\earthday\ >> %logfile%
copy/y/v \\tsclient\C\Code\Javascript\EarthdayPollmap\deploy\latest.7z C:\inetpub\wwwroot\earthday\ >> %logfile%
"C:\Program Files\7-Zip\7z.exe" x -y -oC:\inetpub\wwwroot\earthday C:\inetpub\wwwroot\earthday\latest.7z >> %logfile%
del C:\inetpub\wwwroot\earthday\latest.7z
