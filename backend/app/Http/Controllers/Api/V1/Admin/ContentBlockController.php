<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\SaveContentBlockRequest;
use App\Models\ContentBlock;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

class ContentBlockController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => ContentBlock::query()->orderBy('group')->orderBy('sort_order')->get(),
        ]);
    }

    public function store(SaveContentBlockRequest $request, AuditLogger $audit): JsonResponse
    {
        $block = ContentBlock::query()->create($request->validated());
        $audit->log('content_block.created', $block, ['key' => $block->key]);

        return response()->json(['data' => $block], 201);
    }

    public function update(SaveContentBlockRequest $request, ContentBlock $block, AuditLogger $audit): JsonResponse
    {
        $block->update($request->validated());
        $audit->log('content_block.updated', $block, ['key' => $block->key, 'visible' => $block->is_visible]);

        return response()->json(['data' => $block]);
    }

    public function destroy(ContentBlock $block, AuditLogger $audit): Response
    {
        $audit->log('content_block.deleted', $block, ['key' => $block->key]);
        $block->delete();

        return response()->noContent();
    }
}
