# Build the host deployment bundles (Windows equivalent of build-release.sh).
#
#   output/htdocs/                    complete host root mirror (no .env; secret-free)
#    ├── index.php                    Laravel front controller (deploy/byethost/htdocs/index.php)
#    ├── .htaccess                    API + SPA rewrites (deploy/byethost/htdocs/.htaccess)
#    ├── index.html assets/ fonts/    admin SPA built by Vite
#    └── eshopverse_app/              Laravel application (vendor/ included, no .env)
#   output/eshopverse-admin.zip       SPA archive, contents extract into htdocs/
#   output/eshopverse_app.zip         application archive, root folder eshopverse_app/
#   output/eshopverse-full-deploy.zip everything above PLUS eshopverse_app/.env
#                                     (built only when output/eshopverse-backend.env exists)
#
# Usage:  powershell -ExecutionPolicy Bypass -File deploy/build-release.ps1
#
# The host has no Composer and no shell, so vendor/ is packed; local .env, tests,
# storage contents, and bootstrap/cache are never shipped.
[CmdletBinding()]
param(
    [switch]$SkipAdminBuild
)

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$out = Join-Path $root 'output'
$stage = Join-Path $out 'htdocs'
$app = Join-Path $stage 'eshopverse_app'
$backend = Join-Path $root 'backend'
$dist = Join-Path $root 'admin\dist'
$tar = Join-Path $env:WINDIR 'System32\tar.exe'

function Step([string]$message) { Write-Host "`n==> $message" }

function New-Zip([string]$zipPath, [string[]]$entries) {
    if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
    Push-Location $stage
    try {
        & $tar -a -c -f $zipPath @entries
        if ($LASTEXITCODE -ne 0) { throw "tar failed while writing $zipPath (exit $LASTEXITCODE)" }
    }
    finally { Pop-Location }
}

if (-not $SkipAdminBuild) {
    Step 'Building the admin SPA'
    Push-Location (Join-Path $root 'admin')
    try {
        & npm.cmd run build
        if ($LASTEXITCODE -ne 0) { throw "npm run build failed (exit $LASTEXITCODE)" }
    }
    finally { Pop-Location }
}
if (-not (Test-Path (Join-Path $dist 'index.html'))) {
    throw 'admin/dist/index.html is missing; run npm install && npm run build in admin/'
}

Step 'Staging the host root'
if (Test-Path $stage) { Remove-Item $stage -Recurse -Force }
New-Item -ItemType Directory -Path $stage | Out-Null
Copy-Item (Join-Path $dist '*') $stage -Recurse -Force
Copy-Item (Join-Path $root 'deploy\byethost\htdocs\index.php') $stage
Copy-Item (Join-Path $root 'deploy\byethost\htdocs\.htaccess') $stage

Step 'Staging the Laravel application'
& robocopy $backend $app /E /NFL /NDL /NJH /NJS /NP /XD tests .git /XF .env phpunit.xml .phpunit.result.cache AGENTS.md CLAUDE.md | Out-Null
if ($LASTEXITCODE -ge 8) { throw "robocopy failed (exit $LASTEXITCODE)" }

# The stock welcome page is no longer routed (routes/web.php serves the SPA shell).
Remove-Item (Join-Path $app 'resources\views\welcome.blade.php') -ErrorAction SilentlyContinue

# Runtime state belongs to the host: keep the directories, drop local content.
Get-ChildItem (Join-Path $app 'storage\logs') -File -Filter *.log -ErrorAction SilentlyContinue | Remove-Item -Force
Get-ChildItem (Join-Path $app 'storage\framework\cache\data') -Force -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force
Get-ChildItem (Join-Path $app 'storage\framework\sessions') -Force -ErrorAction SilentlyContinue | Remove-Item -Recurse -Force
Get-ChildItem (Join-Path $app 'storage\framework\views') -File -Filter *.php -ErrorAction SilentlyContinue | Remove-Item -Force
$images = Join-Path $app 'storage\app\product-images'
New-Item -ItemType Directory -Force -Path $images | Out-Null
Set-Content -Path (Join-Path $images '.gitignore') -Value "*`n!.gitignore" -NoNewline

Step 'Packing'
$adminEntries = @('index.html', 'assets', 'fonts') | Where-Object { Test-Path (Join-Path $stage $_) }
New-Zip (Join-Path $out 'eshopverse-admin.zip') $adminEntries
New-Zip (Join-Path $out 'eshopverse_app.zip') @('eshopverse_app')

$envFile = Join-Path $out 'eshopverse-backend.env'
if (Test-Path $envFile) {
    Copy-Item $envFile (Join-Path $app '.env') -Force
    New-Zip (Join-Path $out 'eshopverse-full-deploy.zip') @('index.php', '.htaccess', 'index.html', 'assets', 'fonts', 'eshopverse_app')
    # The staged mirror must stay secret-free.
    Remove-Item (Join-Path $app '.env') -Force
}
else {
    Write-Host '  output\eshopverse-backend.env not found - full bundle skipped'
}

Copy-Item (Join-Path $root 'deploy\upload-README.md') (Join-Path $out 'README.md') -Force

Step 'Result'
Get-ChildItem $out -File -Filter *.zip | ForEach-Object {
    '  {0}  {1:N2} MB' -f $_.Name, ($_.Length / 1MB)
}
Write-Host "  $stage (complete htdocs mirror; upload this folder instead of the zips if you prefer)"
