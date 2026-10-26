<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\CourseResource;
use App\Http\Resources\PageResource;
use App\Http\Resources\ServiceResource;
use App\Models\Course;
use App\Models\Page;
use App\Models\Service;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublicCatalogController extends Controller
{
    public function courses(Request $request): JsonResponse
    {
        $query = Course::query()->published();
        $this->filterCourses($request, $query);

        return CourseResource::collection(
            $query->paginate(min(max($request->integer('per_page', 12), 1), 24))->withQueryString()
        )->response()->header('Cache-Control', 'no-store');
    }

    public function course(string $slug): JsonResponse
    {
        $course = Course::query()->published()->with('modules')->where('slug', $slug)->firstOrFail();

        $related = Course::query()->published()
            ->where('id', '!=', $course->id)
            ->orderByRaw('case when category = ? then 0 else 1 end', [$course->category])
            ->orderByDesc('featured')
            ->limit(3)
            ->get();

        return (new CourseResource($course))->additional([
            'related' => CourseResource::collection($related),
        ])->response()->header('Cache-Control', 'no-store');
    }

    public function services(): JsonResponse
    {
        return ServiceResource::collection(Service::query()->published()->orderBy('sort_order')->get())
            ->response()
            ->header('Cache-Control', 'no-store');
    }

    public function service(string $slug): JsonResponse
    {
        return (new ServiceResource(Service::query()->published()->where('slug', $slug)->firstOrFail()))
            ->response()
            ->header('Cache-Control', 'no-store');
    }

    public function page(string $slug): JsonResponse
    {
        return (new PageResource(Page::query()->published()->where('slug', $slug)->firstOrFail()))
            ->response()
            ->header('Cache-Control', 'no-store');
    }

    private function filterCourses(Request $request, $query): void
    {
        if ($search = trim((string) $request->query('search', ''))) {
            $like = '%'.addcslashes($search, '%_\\').'%';
            $query->where(function ($inner) use ($like) {
                $inner->where('title', 'like', $like)->orWhere('summary', 'like', $like);
            });
        }

        foreach (['category', 'level', 'format'] as $field) {
            if ($request->filled($field)) {
                $query->where($field, $request->string($field));
            }
        }

        match ($request->string('sort')->value()) {
            'title' => $query->orderBy('title'),
            'price' => $query->orderByRaw('price is null')->orderBy('price'),
            default => $query->latest(),
        };
    }
}
