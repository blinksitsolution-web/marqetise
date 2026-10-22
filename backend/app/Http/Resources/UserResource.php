<?php

namespace App\Http\Resources;

use App\Support\PermissionCatalog;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $permissions = [];

        if ($this->relationLoaded('role') && $this->role) {
            $permissions = $this->role->slug === 'super-admin'
                ? array_keys(PermissionCatalog::permissions())
                : $this->role->permissions->pluck('slug')->values()->all();
        }

        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'status' => $this->status,
            'last_login_at' => $this->last_login_at,
            'created_at' => $this->created_at,
            'role' => $this->role ? [
                'id' => $this->role->id,
                'name' => $this->role->name,
                'slug' => $this->role->slug,
            ] : null,
            'permissions' => $permissions,
        ];
    }
}
