<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\Role;
use App\Models\User;
use App\Services\AuditLogger;
use App\Services\MailStatus;
use App\Services\StaffAccountGuard;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

class UserController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = User::query()->with('role.permissions');

        if ($search = trim((string) $request->query('search', ''))) {
            $like = '%'.addcslashes($search, '%_\\').'%';
            $query->where(function ($inner) use ($like) {
                $inner->where('name', 'like', $like)->orWhere('email', 'like', $like);
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('role')) {
            $query->whereHas('role', fn ($role) => $role->where('slug', $request->string('role')));
        }

        return UserResource::collection($query->orderBy('name')->paginate(15));
    }

    public function store(StoreUserRequest $request, StaffAccountGuard $guard, AuditLogger $audit, MailStatus $mail): JsonResponse
    {
        $role = Role::query()->findOrFail($request->integer('role_id'));
        $guard->assertCanAssign($request->user(), $role);

        $suspended = $request->string('status')->value() === 'suspended';
        $user = User::query()->create([
            'name' => $request->validated('name'),
            'email' => $request->validated('email'),
            'phone' => $request->validated('phone'),
            'password' => Str::password(40),
            'status' => $suspended ? 'suspended' : 'invited',
            'role_id' => $role->id,
        ]);

        $delivered = false;
        if (! $suspended && $request->boolean('send_invite', true)) {
            Password::broker()->sendResetLink(['email' => $user->email]);
            $delivered = $mail->canDeliver();
        }

        $audit->log('user.created', $user, ['role' => $role->slug, 'email_delivered' => $delivered]);

        return (new UserResource($user->load('role.permissions')))->additional([
            'message' => $suspended
                ? 'The account was created and suspended.'
                : ($delivered
                    ? 'The account was created and an invitation email was sent.'
                    : 'The account was created. Email delivery is not configured, so the invitation link was written to the application log.'),
            'email_delivered' => $delivered,
        ])->response()->setStatusCode(201);
    }

    public function show(User $user): UserResource
    {
        return new UserResource($user->load('role.permissions'));
    }

    public function update(UpdateUserRequest $request, User $user, StaffAccountGuard $guard, AuditLogger $audit): UserResource
    {
        $role = $request->filled('role_id')
            ? Role::query()->findOrFail($request->integer('role_id'))
            : $user->role;

        if ($request->filled('role_id')) {
            $guard->assertCanAssign($request->user(), $role, $user);
        }

        $status = $request->input('status', $user->status);
        $guard->assertCanChangeStatus($request->user(), $user, $status, $role);

        $user->fill($request->safe()->only(['name', 'email', 'phone', 'status']));
        if ($role) {
            $user->role_id = $role->id;
        }
        $user->save();
        $audit->log('user.updated', $user, ['status' => $user->status, 'role' => $role?->slug]);

        return new UserResource($user->load('role.permissions'));
    }

    public function destroy(Request $request, User $user, AuditLogger $audit): Response
    {
        abort_if($request->user()->is($user), 403, 'You cannot delete your own account.');
        abort_if($user->isLastActiveSuperAdmin(), 403, 'The last active Super Administrator cannot be removed.');
        abort_if($user->isSuperAdmin() && ! $request->user()->isSuperAdmin(), 403, 'You cannot delete a Super Administrator.');

        $audit->log('user.deleted', $user, ['email' => $user->email]);
        $user->delete();

        return response()->noContent();
    }
}
