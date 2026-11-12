# Deployment Assets

Prepared files for the optional public demo. Full instructions, environment guidance, and verification
checklist: [`docs/DEPLOYMENT.md`](../docs/DEPLOYMENT.md).

## Build scripts

```text
deploy/build-release.sh    bash (Git Bash / Linux / macOS)
deploy/build-release.ps1   PowerShell (Windows, no bash required)
```

Both produce the same archives under `output/`:

| Archive | Contents |
|---------|----------|
| `eshopverse-full-deploy.zip` | The complete host root — `index.php`, `.htaccess`, `index.html`, `assets/`, `fonts/`, and `eshopverse_app/` including its `.env` |
| `eshopverse_app.zip` | `eshopverse_app/` only (no `.env`) |
| `eshopverse-admin.zip` | `index.html`, `assets/`, `fonts/` |

The full bundle is produced only when `output/eshopverse-backend.env` exists; that file supplies
`eshopverse_app/.env` and keeps real database credentials out of Git.

## Admin update archive

```text
output/eshopverse-admin.zip   # ~1.08 MB; contents extract directly into htdocs/
├── index.html
├── assets/
└── fonts/
```

The current packages (admin bundle **and** the Laravel application archive) are generated under
`output/`; see [`docs/DEPLOYMENT.md`](../docs/DEPLOYMENT.md#upload-packages-2026-10-28). The earlier
`deploy/eshopverse-admin-dist.zip` name described the same admin layout and is no longer kept in the tree.

Upload the archive to `htdocs`, extract it over the existing `index.html`, `assets/`, and `fonts/`, delete any
old `_worker.js`, then hard-refresh. The backend and database are unchanged by the theme update.

## Laravel front controller

```text
deploy/byethost/htdocs/index.php
deploy/byethost/htdocs/.htaccess
```

These are the same files already deployed at the host root. Keep them if you rebuild the host. `.htaccess`
is hidden by default in the file manager; enable “Show hidden files” before uploading it.

## Security

- Never commit `eshopverse_app/.env`, database passwords, `APP_KEY`, or the demo administrator password.
- The live Laravel app lives in `htdocs/eshopverse_app/`; its own `.htaccess` denies direct web access.
- Use HTTPS and keep `APP_DEBUG=false` on the host.

The `*.zip` archive is intentionally ignored by Git (`.gitignore`); the source of truth is `admin/` plus
`npm run build`. The deployment scripts in this folder are tracked.
