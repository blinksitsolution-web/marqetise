<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

class AuditLogger
{
    public function log(string $action, ?Model $auditable = null, array $metadata = []): void
    {
        AuditLog::query()->create([
            'user_id' => Auth::id(),
            'action' => $action,
            'auditable_type' => $auditable ? $auditable::class : null,
            'auditable_id' => $auditable?->getKey(),
            'metadata' => $metadata === [] ? null : $metadata,
            'ip_address' => request()->ip(),
        ]);
    }
}
