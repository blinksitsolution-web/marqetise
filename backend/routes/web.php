<?php

use App\Models\Course;
use App\Models\Page;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'name' => config('app.name'),
        'message' => 'Marqetise API is running.',
        'frontend' => config('marqetise.frontend_url'),
    ]);
});

Route::get('/sitemap.xml', function () {
    $base = config('marqetise.frontend_url');
    $urls = [
        $base.'/',
        $base.'/about',
        $base.'/services',
        $base.'/courses',
        $base.'/contact',
        $base.'/book',
    ];

    foreach (Page::query()->published()->pluck('slug') as $slug) {
        if (! in_array($slug, ['home', 'about', 'contact'], true)) {
            $urls[] = $base.'/'.$slug;
        }
    }

    foreach (Course::query()->published()->pluck('slug') as $slug) {
        $urls[] = $base.'/courses/'.$slug;
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
