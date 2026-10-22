<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\SaveServiceRequest;
use App\Http\Resources\ServiceResource;
use App\Models\Service;
use App\Services\AuditLogger;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class ServiceController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return ServiceResource::collection(Service::query()->orderBy('sort_order')->get());
    }

    public function store(SaveServiceRequest $request, AuditLogger $audit): ServiceResource
    {
        $service = Service::query()->create($request->validated());
        $audit->log('service.created', $service, ['status' => $service->status]);

        return new ServiceResource($service);
    }

    public function update(SaveServiceRequest $request, Service $service, AuditLogger $audit): ServiceResource
    {
        $service->update($request->validated());
        $audit->log('service.updated', $service, ['status' => $service->status]);

        return new ServiceResource($service);
    }

    public function destroy(Service $service, AuditLogger $audit): Response
    {
        $audit->log('service.deleted', $service, ['slug' => $service->slug]);
        $service->delete();

        return response()->noContent();
    }
}
