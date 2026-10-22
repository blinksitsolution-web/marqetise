<?php

use App\Support\FrontendOrigins;

$frontend = (string) env('FRONTEND_URL', 'http://localhost:5173');

return [

    'paths' => ['api/*', 'sanctum/csrf-cookie', 'sitemap.xml', 'robots.txt'],

    'allowed_methods' => ['*'],

    'allowed_origins' => FrontendOrigins::list((string) env('APP_ENV', 'production'), $frontend),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];
