<?php

use App\Models\Course;
use App\Models\Page;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

Route::get('/up', function () {
    try {
        DB::select('select 1 as ok');
    } catch (\Throwable) {
        return response()->json(['status' => 'down'], 503);
    }

    return response()->json(['status' => 'ok']);
});

Route::get('/', function () {
    return response()->json([
        'name' => config('app.name'),
        'message' => 'Marqetise API is running.',
        'frontend' => config('marqetise.frontend_url'),
    ]);
});

Route::get('/sitemap.xml', function () {
    $base = rtrim((string) config('marqetise.frontend_url'), '/');
    $urls = array_map(
        fn (string $path) => $base.$path,
        ['/', '/about', '/services', '/courses', '/contact', '/book'],
    );

    $frontend = dirname(base_path()).DIRECTORY_SEPARATOR.'frontend'.DIRECTORY_SEPARATOR;
    foreach (Page::query()->published()->pluck('slug') as $slug) {
        if (! is_string($slug) || ! preg_match('/^[a-z0-9-]+$/', $slug)) {
            continue;
        }
        if (! is_file($frontend.'page-'.$slug.'.html')) {
            continue;
        }
        $urls[] = $base.'/'.$slug;
    }

    foreach (Course::query()->published()->pluck('slug') as $slug) {
        if (is_string($slug) && preg_match('/^[a-z0-9-]+$/', $slug)) {
            $urls[] = $base.'/courses/'.$slug;
        }
    }

    $body = collect(array_unique($urls))
        ->map(fn (string $url) => '<url><loc>'.e($url).'</loc></url>')
        ->implode('');

    return response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'.$body.'</urlset>', 200, [
        'Content-Type' => 'application/xml',
    ]);
});

Route::get('/robots.txt', function () {
    $lines = [
        'User-agent: *',
        'Disallow: /admin',
        'Disallow: /api',
        'Sitemap: '.config('marqetise.frontend_url').'/sitemap.xml',
    ];

    return response(implode("\n", $lines), 200, ['Content-Type' => 'text/plain']);
});
