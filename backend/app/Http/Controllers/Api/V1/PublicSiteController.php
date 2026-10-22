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
use Illuminate\Http\JsonResponse;

class PublicSiteController extends Controller
{
    public function show(): JsonResponse
    {
        $settings = Setting::query()->where('is_public', true)->get()
            ->mapWithKeys(fn (Setting $setting) => [$setting->key => Setting::getValue($setting->key)])
            ->only(config('marqetise.public_setting_keys'));

        $blocks = ContentBlock::query()->where('is_visible', true)->orderBy('sort_order')->get()
            ->mapWithKeys(fn (ContentBlock $block) => [$block->key => [
                'label' => $block->label,
                'group' => $block->group,
                'payload' => $block->payload,
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
                'pages' => Page::query()->published()->orderBy('title')->get(['title', 'slug', 'excerpt', 'meta_title', 'meta_description']),
                'blocks' => $blocks,
                'services' => ServiceResource::collection(Service::query()->published()->orderBy('sort_order')->get()),
                'featured_courses' => CourseResource::collection(
                    Course::query()->published()->where('featured', true)->with('modules')->orderBy('sort_order')->limit(6)->get()
                ),
                'faqs' => $faqs,
            ],
        ]);
    }
}
