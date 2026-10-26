<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateSettingsRequest;
use App\Models\Setting;
use App\Support\GhanaPhone;
use App\Services\AuditLogger;
use App\Services\MailStatus;
use Illuminate\Http\JsonResponse;

class SettingController extends Controller
{
    public function index(): JsonResponse
    {
        $keys = array_merge(config('marqetise.public_setting_keys'), config('marqetise.private_setting_keys'));
        $settings = collect($keys)
            ->mapWithKeys(fn (string $key) => [$key => $key === 'phone' ? GhanaPhone::format(Setting::getValue($key)) : Setting::getValue($key)]);

        return response()->json([
            'data' => $settings,
            'mail_can_deliver' => app(MailStatus::class)->canDeliver(),
        ]);
    }

    public function update(UpdateSettingsRequest $request, AuditLogger $audit): JsonResponse
    {
        $public = config('marqetise.public_setting_keys');
        $private = config('marqetise.private_setting_keys');

        foreach ($request->validated('settings') as $key => $value) {
            if ($value === '') {
                $value = null;
            }

            Setting::putValue($key, $value, in_array($key, $private, true) ? 'private' : 'general', in_array($key, $public, true));
        }

        $audit->log('settings.updated', null, ['keys' => array_keys($request->validated('settings'))]);

        return $this->index();
    }
}
