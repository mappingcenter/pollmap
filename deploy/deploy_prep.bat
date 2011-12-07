echo ===== FanMap: Bracketography Edition Pre-Deploy Script =====
set app_path="C:\Code\Javascript\EarthdayPollmap\"
set timestamp=%date:~12,2%_%date:~4,2%_%date:~7,2%-%time:~0,2%%time:~3,2%%time:~6,2%
if " "=="%timestamp:~9,1%" set timestamp=%timestamp:~0,9%0%timestamp:~10,5%
if EXIST %app_path%\deploy\latest.7z del %app_path%\deploy\latest.7z
"C:\Program Files\7-Zip\7z.exe" a %app_path%\deploy\latest.7z %app_path%\index.html
"C:\Program Files\7-Zip\7z.exe" a %app_path%\deploy\latest.7z %app_path%\js
"C:\Program Files\7-Zip\7z.exe" a %app_path%\deploy\latest.7z %app_path%\css
"C:\Program Files\7-Zip\7z.exe" a %app_path%\deploy\latest.7z %app_path%\lib
copy/y/v %app_path%\deploy\latest.7z %app_path%\deploy\%timestamp%.7z
