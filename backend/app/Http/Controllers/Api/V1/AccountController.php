<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\AccountUpdateRequest;
use App\Http\Resources\UserResource;
use App\Services\AuditLogger;
use App\Services\AuthenticatedSessionRevoker;

class AccountController extends Controller
{
    public function update(AccountUpdateRequest $request, AuditLogger $audit, AuthenticatedSessionRevoker $sessions): UserResource
    {
        $user = $request->user();
        $data = $request->safe()->only(['name', 'phone']);
        $password = $request->filled('password') ? $request->string('password')->value() : null;

        if ($password !== null) {
            $data['password'] = $password;
        }

        $user->fill($data)->save();

        if ($password !== null) {
            $sessions->revokeAfterPasswordChange($user, $password, $request, keepCurrent: true);
        }

        $audit->log('account.updated', $user, [
            'password_changed' => $password !== null,
        ]);

        return new UserResource($user->load('role.permissions'));
    }
}
