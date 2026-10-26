<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\CourseResource;
use App\Http\Resources\ServiceResource;
use App\Models\ContentBlock;
use App\Models\Course;
use App\Models\Faq;
use App\Models\Page;
use App\Models\Service;
use App\Models\Setting;
use App\Support\GhanaPhone;
use App\Support\PublicMedia;
use Illuminate\Http\JsonResponse;

class PublicSiteController extends Controller
{
    public function show(): JsonResponse
    {
        $settings = Setting::query()->where('is_public', true)->get()
            ->mapWithKeys(fn (Setting $setting) => [$setting->key => Setting::decodeStored($setting->value)])
            ->only(config('marqetise.public_setting_keys'))
            ->all();
        if (array_key_exists('phone', $settings)) {
            $settings['phone'] = GhanaPhone::format($settings['phone']);
        }
        $logo = PublicMedia::publish($settings['logo_url'] ?? null);
        $settings['logo_url'] = $logo === '' || $logo === null ? null : $logo;

        $blocks = ContentBlock::query()->where('is_visible', true)->orderBy('sort_order')->get()
            ->mapWithKeys(fn (ContentBlock $block) => [$block->key => [
                'label' => $block->label,
                'group' => $block->group,
                'payload' => PublicMedia::present($block->payload),
            ]]);

        $faqs = Faq::query()->where('is_published', true)->orderBy('sort_order')->get()
            ->groupBy('context')
            ->map(fn ($items) => $items->map(fn (Faq $faq) => [
                'question' => $faq->question,
                'answer' => $faq->answer,
            ])->values());

        return response()->json([
            'data' => [
                'settings' => $settings,
                'pages' => Page::query()->published()->orderBy('title')->get(['title', 'slug', 'excerpt', 'body', 'meta_title', 'meta_description']),
                'blocks' => $blocks,
                'services' => collect(ServiceResource::collection(Service::query()->published()->orderBy('sort_order')->get())->resolve())
                    ->map(fn (array $service) => array_merge($service, [
                        'image_path' => PublicMedia::publish($service['image_path'] ?? null) ?: null,
                    ]))
                    ->values(),
                'featured_courses' => collect(CourseResource::collection(
                    Course::query()->published()->where('featured', true)->orderBy('sort_order')->limit(6)->get()
                )->resolve())
                    ->map(fn (array $course) => array_merge($course, [
                        'image_path' => PublicMedia::publish($course['image_path'] ?? null) ?: null,
                    ]))
                    ->values(),
                'faqs' => $faqs,
                'booking_times' => config('marqetise.booking_times'),
            ],
        ])->header('Cache-Control', 'no-store');
    }
}
