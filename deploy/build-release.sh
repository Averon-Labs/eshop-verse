#!/usr/bin/env bash
#
# Build and pack the host upload bundles documented in docs/DEPLOYMENT.md.
#
#   output/htdocs/                 complete host root mirror (upload one folder, or use the zips)
#    ├── index.php                 Laravel front controller (deploy/byethost/htdocs/index.php)
#    ├── .htaccess                 API + SPA rewrites (deploy/byethost/htdocs/.htaccess)
#    ├── index.html assets/ fonts/ admin SPA built by Vite
#    └── eshopverse_app/           Laravel application (vendor/ included, no .env)
#   output/eshopverse-admin.zip    SPA archive, contents extract into htdocs/
#   output/eshopverse_app.zip      application archive, root folder eshopverse_app/
#
# Usage:  bash deploy/build-release.sh
# The host has no Composer and no shell, so vendor/ is packed; .env, storage
# contents, and bootstrap/cache are never shipped.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/output"
STAGE="$OUT/htdocs"
APP="$STAGE/eshopverse_app"
ADMIN_DIST="$ROOT/admin/dist"

step() { printf '\n==> %s\n' "$1"; }

make_zip() { # make_zip <zip-path> <source-dir> <entry>...
    local zip_path="$1" src_dir="$2" entry
    shift 2
    rm -f "$zip_path"

    if command -v zip >/dev/null 2>&1; then
        (cd "$src_dir" && zip -qr "$zip_path" "$@")
        return
    fi

    # Windows ships bsdtar, which writes zip when the name ends in .zip.
    if [ -x /c/Windows/System32/tar.exe ]; then
        local win_zip
        win_zip="$(cygpath -m "$zip_path" 2>/dev/null || printf '%s' "$zip_path")"
        (cd "$src_dir" && MSYS_NO_PATHCONV=1 /c/Windows/System32/tar.exe -a -c -f "$win_zip" "$@")
        return
    fi

    if command -v powershell >/dev/null 2>&1; then
        local items="" item
        for item in "$@"; do items+="'$item',"; done
        powershell -NoProfile -Command \
            "Compress-Archive -Force -Path @(${items%,}) -DestinationPath '$zip_path'"
        return
    fi

    echo "No zip tool found (zip, bsdtar, or PowerShell)." >&2
    exit 1
}

step "Building the admin SPA"
cd "$ROOT/admin"
npm ci --no-audit --no-fund
npm run build   # tsc --noEmit && vite build (VITE_API_BASE_URL=/api/v1 from .env.production)
test -f "$ADMIN_DIST/index.html" || { echo "admin/dist/index.html is missing" >&2; exit 1; }

step "Staging the host root"
rm -rf "$STAGE"
mkdir -p "$STAGE"
cp -a "$ADMIN_DIST"/. "$STAGE"/
cp "$ROOT/deploy/byethost/htdocs/index.php" "$STAGE/index.php"
cp "$ROOT/deploy/byethost/htdocs/.htaccess" "$STAGE/.htaccess"

step "Staging the Laravel application"
mkdir -p "$APP"
cp -a "$ROOT/backend"/. "$APP"/

# Local-only and development artefacts never reach the host.
rm -f "$APP/.env" "$APP/phpunit.xml" "$APP/.phpunit.result.cache"
rm -f "$APP/AGENTS.md" "$APP/CLAUDE.md"
rm -rf "$APP/tests"
# The stock welcome page is no longer routed (routes/web.php serves the SPA shell).
rm -f "$APP/resources/views/welcome.blade.php"

# Runtime state belongs to the host: keep the directories, drop local content.
find "$APP/storage/logs" -type f -name '*.log' -delete
find "$APP/storage/framework/cache/data" -mindepth 1 -delete 2>/dev/null || true
find "$APP/storage/framework/sessions" -mindepth 1 -delete 2>/dev/null || true
find "$APP/storage/framework/views" -type f -name '*.php' -delete
mkdir -p "$APP/storage/app/product-images"
printf '*\n!.gitignore\n' >"$APP/storage/app/product-images/.gitignore"

step "Packing"
entry_list=()
for name in index.html assets fonts; do
    [ -e "$STAGE/$name" ] && entry_list+=("$name")
done
make_zip "$OUT/eshopverse-admin.zip" "$STAGE" "${entry_list[@]}"
make_zip "$OUT/eshopverse_app.zip" "$STAGE" eshopverse_app

cp "$ROOT/deploy/upload-README.md" "$OUT/README.md"

step "Result"
du -h "$OUT/eshopverse-admin.zip" "$OUT/eshopverse_app.zip" | sed 's/^/  /'
printf '  %s\n' "$STAGE (complete htdocs mirror; upload this folder instead of the zips if you prefer)"
