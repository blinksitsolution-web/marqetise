<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    public function update(User $actor, User $target): bool
    {
        if ($target->isSuperAdmin() && ! $actor->isSuperAdmin()) {
            return false;
        }

        if ($actor->is($target) && $this->roleIsChanging($target)) {
            return false;
        }

        return ! $this->removesLastSuperAdmin($target);
    }

    public function delete(User $actor, User $target): bool
    {
        if ($actor->is($target)) {
            return false;
        }

        if ($target->isSuperAdmin() && ! $actor->isSuperAdmin()) {
            return false;
        }

        return ! $target->isLastActiveSuperAdmin();
    }

    private function removesLastSuperAdmin(User $target): bool
    {
        if (! $target->isLastActiveSuperAdmin()) {
            return false;
        }

        $status = (string) request()->input('status', $target->status);
        $roleId = $this->requestedRoleId($target);

        return $status !== 'active' || $roleId !== (int) $target->role_id;
    }

    private function roleIsChanging(User $target): bool
    {
        return request()->exists('role_id') && $this->requestedRoleId($target) !== (int) $target->role_id;
    }

    private function requestedRoleId(User $target): int
    {
        if (! request()->exists('role_id')) {
            return (int) $target->role_id;
        }

        return (int) request()->input('role_id');
    }
}
