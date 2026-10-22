<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\CourseResource;
use App\Http\Resources\PageResource;
use App\Http\Resources\ServiceResource;
use App\Models\Course;
use App\Models\Page;
use App\Models\Service;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PublicCatalogController extends Controller
{
    public function courses(Request $request): AnonymousResourceCollection
    {
        $query = Course::query()->published()->with('modules');
        $this->filterCourses($request, $query);

        return CourseResource::collection(
            $query->paginate(min(max($request->integer('per_page', 12), 1), 24))->withQueryString()
        );
    }

    public function course(string $slug): CourseResource
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
        ]);
    }

    public function services(): AnonymousResourceCollection
    {
        return ServiceResource::collection(Service::query()->published()->orderBy('sort_order')->get());
    }

    public function service(string $slug): ServiceResource
    {
        return new ServiceResource(Service::query()->published()->where('slug', $slug)->firstOrFail());
    }

    public function page(string $slug): PageResource
    {
        return new PageResource(Page::query()->published()->where('slug', $slug)->firstOrFail());
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
