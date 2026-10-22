<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\AccountUpdateRequest;
use App\Http\Resources\UserResource;
use App\Services\AuditLogger;

class AccountController extends Controller
{
    public function update(AccountUpdateRequest $request, AuditLogger $audit): UserResource
    {
        $user = $request->user();
        $data = $request->safe()->only(['name', 'phone']);

        if ($request->filled('password')) {
            $data['password'] = $request->string('password')->value();
        }

        $user->fill($data)->save();
        $audit->log('account.updated', $user, [
            'password_changed' => $request->filled('password'),
        ]);

        return new UserResource($user->load('role.permissions'));
    }
}
