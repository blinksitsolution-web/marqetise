<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasPermission
{
    public function handle(Request $request, Closure $next, string ...$permissions): Response
    {
        $user = $request->user();

        if ($user === null) {
            abort(401, 'Authentication is required.');
        }

        foreach ($permissions as $permission) {
            if (! $user->hasPermission($permission)) {
                abort(403, 'This action is unauthorized.');
            }
        }

        return $next($request);
    }
}
