<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['name', 'email', 'password', 'phone', 'status', 'role_id', 'last_login_at'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    public function isSuperAdmin(): bool
    {
        return $this->role?->slug === 'super-admin';
    }

    public function hasPermission(string $permission): bool
    {
        if ($this->status !== 'active') {
            return false;
        }

        $this->loadMissing('role.permissions');

        if ($this->role === null) {
            return false;
        }

        if ($this->role->slug === 'super-admin') {
            return true;
        }

        return $this->role->permissions->contains('slug', $permission);
    }

    public function isLastActiveSuperAdmin(): bool
    {
        if (! $this->isSuperAdmin() || $this->status !== 'active') {
            return false;
        }

        return static::query()
            ->where('status', 'active')
            ->where('role_id', $this->role_id)
            ->count() <= 1;
    }
}
