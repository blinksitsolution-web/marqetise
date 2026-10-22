<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\SavePageRequest;
use App\Http\Resources\PageResource;
use App\Models\Page;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class PageController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Page::query()->with('editor:id,name');

        if ($search = trim((string) $request->query('search', ''))) {
            $like = '%'.addcslashes($search, '%_\\').'%';
            $query->where(function ($inner) use ($like) {
                $inner->where('title', 'like', $like)->orWhere('slug', 'like', $like);
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        return PageResource::collection($query->latest('updated_at')->paginate(12));
    }

    public function store(SavePageRequest $request, AuditLogger $audit): JsonResponse
    {
        $page = Page::query()->create($this->attributes($request));
        $audit->log('page.created', $page, ['status' => $page->status]);

        return (new PageResource($page->load('editor')))->response()->setStatusCode(201);
    }

    public function show(Page $page): PageResource
    {
        return new PageResource($page->load('editor'));
    }

    public function update(SavePageRequest $request, Page $page, AuditLogger $audit): PageResource
    {
        $page->update($this->attributes($request, $page));
        $audit->log('page.updated', $page, ['status' => $page->status]);

        return new PageResource($page->load('editor'));
    }

    public function destroy(Page $page, AuditLogger $audit): Response
    {
        $audit->log('page.deleted', $page, ['slug' => $page->slug]);
        $page->delete();

        return response()->noContent();
    }

    private function attributes(SavePageRequest $request, ?Page $page = null): array
    {
        $data = $request->safe()->except([]);
        $data['updated_by'] = $request->user()->id;

        if ($data['status'] === 'published' && ($page === null || $page->published_at === null)) {
            $data['published_at'] = now();
        }

        return $data;
    }
}
