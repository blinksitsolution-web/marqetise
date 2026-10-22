<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AuthenticatedSessionRevoker
{
    public function revokeAfterPasswordChange(User $user, string $password, Request $request, bool $keepCurrent): void
    {
        $user->forceFill([
            'remember_token' => Str::random(60),
        ])->save();

        $web = Auth::guard('web');

        if ($keepCurrent && $web->id() === $user->id) {
            $web->logoutOtherDevices($password);
        }

        $sessions = DB::table('sessions')->where('user_id', $user->id);

        if ($keepCurrent && $request->hasSession()) {
            $sessions->where('id', '!=', $request->session()->getId());
        }

        $sessions->delete();

        if ($keepCurrent && $request->hasSession()) {
            $request->session()->regenerate(true);
        }
    }
}
