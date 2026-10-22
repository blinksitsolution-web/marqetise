<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\SaveRoleRequest;
use App\Models\Permission;
use App\Models\Role;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class RoleController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => [
                'roles' => Role::query()->with('permissions:id,name,slug,group')->orderBy('name')->get(),
                'permissions' => Permission::query()->orderBy('group')->orderBy('name')->get(),
            ],
        ]);
    }

    public function store(SaveRoleRequest $request, AuditLogger $audit): JsonResponse
    {
        $role = DB::transaction(function () use ($request) {
            $role = Role::query()->create([
                ...$request->safe()->only(['name', 'slug', 'description']),
                'is_system' => false,
            ]);
            $this->sync($request, $role);

            return $role->load('permissions');
        });

        $audit->log('role.created', $role, ['slug' => $role->slug]);

        return response()->json(['data' => $role], 201);
    }

    public function update(SaveRoleRequest $request, Role $role, AuditLogger $audit): JsonResponse
    {
        abort_if($role->slug === 'super-admin', 403, 'The Super Administrator role always has every permission.');

        if ($role->is_system && $request->input('slug') !== $role->slug) {
            abort(422, 'System role identifiers cannot be renamed.');
        }

        DB::transaction(function () use ($request, $role): void {
            $role->update($request->safe()->only(['name', 'slug', 'description']));
            $this->sync($request, $role);
        });

        $audit->log('role.updated', $role, ['slug' => $role->slug]);

        return response()->json(['data' => $role->load('permissions')]);
    }

    private function sync(SaveRoleRequest $request, Role $role): void
    {
        $permissions = Permission::query()->whereIn('id', $request->input('permission_ids', []))->get();
        $actor = $request->user();

        if (! $actor->isSuperAdmin()) {
            $actor->loadMissing('role.permissions');
            $outside = $permissions->pluck('slug')->diff($actor->role?->permissions->pluck('slug') ?? collect());
            abort_if($outside->isNotEmpty(), 403, 'You cannot grant a permission you do not have.');
        }

        $role->permissions()->sync($permissions->pluck('id'));
    }
}
