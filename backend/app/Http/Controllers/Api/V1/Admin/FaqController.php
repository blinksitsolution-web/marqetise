<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\SaveFaqRequest;
use App\Models\Faq;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

class FaqController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(['data' => Faq::query()->orderBy('context')->orderBy('sort_order')->get()]);
    }

    public function store(SaveFaqRequest $request, AuditLogger $audit): JsonResponse
    {
        $faq = Faq::query()->create($request->validated());
        $audit->log('faq.created', $faq);

        return response()->json(['data' => $faq], 201);
    }

    public function update(SaveFaqRequest $request, Faq $faq, AuditLogger $audit): JsonResponse
    {
        $faq->update($request->validated());
        $audit->log('faq.updated', $faq);

        return response()->json(['data' => $faq]);
    }

    public function destroy(Faq $faq, AuditLogger $audit): Response
    {
        $audit->log('faq.deleted', $faq);
        $faq->delete();

        return response()->noContent();
    }
}
