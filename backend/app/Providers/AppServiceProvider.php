<?php

namespace App\Providers;

use App\Models\User;
use App\Policies\UserPolicy;
use App\Support\ProductionConfiguration;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\SessionGuard;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Middleware\TrustProxies;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;
use Laravel\Sanctum\Sanctum;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Gate::policy(User::class, UserPolicy::class);
        app(ProductionConfiguration::class)->assertSafe();

        if ($this->app->environment('production')) {
            URL::forceScheme('https');
        }

        $proxies = config('marqetise.trusted_proxies', []);
        if (is_array($proxies) && $proxies !== []) {
            TrustProxies::at($proxies);
        }
        Sanctum::authenticateAccessTokensUsing(static fn (): bool => false);

        $this->app->booted(function (): void {
            if (empty(config('app.key'))) {
                return;
            }

            $guard = Auth::guard('web');

            if ($guard instanceof SessionGuard) {
                $guard->setRememberDuration(60 * 24 * 14);
            }
        });

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

        RateLimiter::for('api', function (Request $request) {
            if ($request->user()) {
                return Limit::perMinute(60)->by('user:'.$request->user()->getAuthIdentifier());
            }

            if ($request->isMethod('GET') || $request->isMethod('HEAD')) {
                return Limit::perMinute(120)->by('ip:'.$request->ip());
            }

            return Limit::perMinute(60)->by('ip:'.$request->ip());
        });

        RateLimiter::for('inquiries', function (Request $request) {
            return Limit::perMinute(5)->by($request->ip());
        });
    }
}
