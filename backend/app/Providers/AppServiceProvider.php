<?php

namespace App\Providers;

use App\Models\User;
use App\Policies\UserPolicy;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Gate::policy(User::class, UserPolicy::class);

        Password::defaults(fn () => Password::min(12)->mixedCase()->numbers()->symbols());

        ResetPassword::createUrlUsing(function (object $user, string $token) {
            return config('marqetise.frontend_url')
                .'/admin/reset-password?token='.$token
                .'&email='.urlencode($user->email);
        });

        RateLimiter::for('login', function (Request $request) {
            $email = strtolower((string) $request->input('email'));

            return Limit::perMinute(5)->by($email.'|'.$request->ip());
        });

        RateLimiter::for('inquiries', function (Request $request) {
            return Limit::perMinute(5)->by($request->ip());
        });
    }
}
