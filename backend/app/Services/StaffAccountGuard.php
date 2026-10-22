<?php

namespace App\Services;

use App\Models\Role;
use App\Models\User;

class StaffAccountGuard
{
    public function assertCanAssign(User $actor, Role $role, ?User $target = null): void
    {
        if ($target && $actor->is($target)) {
            abort(403, 'You cannot change your own role.');
        }

        if ($role->slug === 'super-admin' && ! $actor->isSuperAdmin()) {
            abort(403, 'You cannot assign the Super Administrator role.');
        }

        if ($actor->isSuperAdmin()) {
            return;
        }

        $actor->loadMissing('role.permissions');
        $role->loadMissing('permissions');

        $actorPermissions = $actor->role?->permissions->pluck('slug') ?? collect();
        $outside = $role->permissions->pluck('slug')->diff($actorPermissions);

        if ($outside->isNotEmpty()) {
            abort(403, 'You cannot assign a role with permissions you do not have.');
        }
    }

    public function assertCanChangeStatus(User $actor, User $target, string $status, ?Role $nextRole = null): void
    {
        if ($actor->is($target) && $status !== 'active') {
            abort(403, 'You cannot deactivate your own account.');
        }

        if (! $target->isLastActiveSuperAdmin()) {
            return;
        }

        $roleChanges = $nextRole && $nextRole->id !== $target->role_id;

        if ($status !== 'active' || $roleChanges) {
            abort(403, 'The last active Super Administrator cannot be removed.');
        }
    }
}
