<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web routes
|--------------------------------------------------------------------------
|
| The admin SPA and the API share one origin on the host (docs/DEPLOYMENT.md):
| the front controller's .htaccess rewrites "/" and SPA routes to index.html.
| This route is the safety net for a root without that .htaccess (for example
| a fresh file-manager upload), so it must serve the built admin shell and
| never Laravel's stock "welcome" page.
|
*/

Route::get('/', function () {
    // Host layout: htdocs/index.html next to htdocs/eshopverse_app/.
    // Local/dev layout: the bundle dropped into public/.
    foreach ([base_path('../index.html'), public_path('index.html')] as $shell) {
        if (is_file($shell)) {
            return response()->file($shell, ['Content-Type' => 'text/html; charset=utf-8']);
        }
    }

    return response(
        '<!doctype html><html lang="en"><head><meta charset="utf-8">'
        .'<meta name="viewport" content="width=device-width, initial-scale=1">'
        .'<title>EShop Verse</title></head><body>'
        .'<h1>EShop Verse API is running</h1>'
        .'<p>The admin panel bundle is not deployed yet. Upload the admin archive '
        .'(index.html, assets/, fonts/) and the root index.php + .htaccess into htdocs.</p>'
        .'<p>Health: <a href="/up">/up</a> &middot; Catalog: <a href="/api/v1/products">/api/v1/products</a></p>'
        .'</body></html>',
        200,
        ['Content-Type' => 'text/html; charset=utf-8'],
    );
});
