<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\AuditLogger;
use App\Services\MailStatus;
use App\Services\AuthenticatedSessionRevoker;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(LoginRequest $request, AuditLogger $audit): UserResource
    {
        if (! Auth::attempt($request->only('email', 'password'), $request->boolean('remember'))) {
            throw ValidationException::withMessages([
                'email' => 'Incorrect email or password.',
            ]);
        }

        /** @var User $user */
        $user = Auth::user();

        if ($user->status !== 'active') {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            throw ValidationException::withMessages([
                'email' => $user->status === 'suspended'
                    ? 'This account cannot sign in. Contact an administrator.'
                    : 'Incorrect email or password.',
            ]);
        }

        $request->session()->regenerate();
        $user->forceFill(['last_login_at' => now()])->save();
        $audit->log('auth.login', $user);
        $user->load('role.permissions');

        return new UserResource($user);
    }

    public function logout(Request $request, AuditLogger $audit): JsonResponse
    {
        $audit->log('auth.logout', $request->user());
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Signed out.']);
    }

    public function user(Request $request): UserResource
    {
        return new UserResource($request->user()->load('role.permissions'));
    }

    public function forgotPassword(ForgotPasswordRequest $request, MailStatus $mail): JsonResponse
    {
        $user = User::query()->where('email', $request->string('email'))->first();

        if ($user && $user->status !== 'suspended' && $mail->canDeliver()) {
            Password::broker()->sendResetLink(['email' => $user->email]);
        }

        return response()->json([
            'message' => "If an account exists, we've sent a link.",
        ]);
    }

    public function resetPassword(ResetPasswordRequest $request, AuditLogger $audit, AuthenticatedSessionRevoker $sessions): JsonResponse
    {
        $status = Password::broker()->reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) use ($audit, $request, $sessions): void {
                $user->forceFill([
                    'password' => $password,
                    'status' => $user->status === 'invited' ? 'active' : $user->status,
                    'email_verified_at' => $user->email_verified_at ?? now(),
                ])->save();

                $sessions->revokeAfterPasswordChange($user, $password, $request, keepCurrent: false);
                event(new PasswordReset($user));
                $audit->log('auth.password_reset', $user);
            },
        );

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages([
                'email' => 'This reset link is invalid or has expired.',
            ]);
        }

        return response()->json(['message' => 'Your password has been updated. You can sign in.']);
    }
}
