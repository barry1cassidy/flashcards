$ErrorActionPreference = 'Stop'

$android = Join-Path (Split-Path $PSScriptRoot -Parent) 'android'
$jks = Join-Path $android 'zipdeck-upload.jks'
$props = Join-Path $android 'keystore.properties'

if (Test-Path $jks) {
    Write-Output "Upload keystore already exists. Not overwriting."
    exit 0
}

$bytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
$pass = -join ($bytes | ForEach-Object { '{0:x2}' -f $_ })

@(
    'storeFile=zipdeck-upload.jks'
    "storePassword=$pass"
    'keyAlias=zipdeck-upload'
    "keyPassword=$pass"
) | Set-Content -Path $props -Encoding ascii

cmd /c "keytool -genkeypair -keystore `"$jks`" -alias zipdeck-upload -keyalg RSA -keysize 2048 -validity 10000 -storetype PKCS12 -dname `"CN=Zipdeck, O=Zipdeck, C=US`" -storepass $pass -keypass $pass -noprompt >nul 2>&1"
if ($LASTEXITCODE -ne 0 -or -not (Test-Path $jks)) {
    throw 'Failed to create upload keystore'
}

Write-Output "Created upload keystore (gitignored)."
Write-Output "Backup these two files offline, then keep the copies private:"
Write-Output $jks
Write-Output $props
