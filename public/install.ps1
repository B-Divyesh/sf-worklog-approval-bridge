$ErrorActionPreference = "Stop"
$repo = "B-Divyesh/sf-worklog-approval-bridge"
$release = Invoke-RestMethod "https://api.github.com/repos/$repo/releases/latest"
$asset = $release.assets | Where-Object { $_.name -match '\.(msi|exe)$' } | Select-Object -First 1
if (-not $asset) { throw "No Windows release file is published yet." }
$tempDir = Join-Path ([IO.Path]::GetTempPath()) ("worklog-bridge-" + [guid]::NewGuid())
New-Item -ItemType Directory -Path $tempDir | Out-Null
try {
  $installer = Join-Path $tempDir $asset.name
  Invoke-WebRequest $asset.browser_download_url -OutFile $installer
  $sums = Invoke-RestMethod "https://github.com/$repo/releases/latest/download/SHA256SUMS"
  $expected = (($sums -split "`n" | Where-Object { $_ -match ("  " + [regex]::Escape($asset.name) + "$") }) -split "  ")[0]
  $actual = (Get-FileHash $installer -Algorithm SHA256).Hash.ToLower()
  if ($actual -ne $expected.ToLower()) { throw "Checksum verification failed." }
  Write-Host "Verified $($asset.name). Starting the unsigned preview installer."
  if ($asset.name -match '\.msi$') { Start-Process msiexec.exe -Wait -ArgumentList "/i `"$installer`"" } else { Start-Process $installer -Wait }
  Write-Host "Worklog Bridge installation finished."
} finally {
  Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue
}
