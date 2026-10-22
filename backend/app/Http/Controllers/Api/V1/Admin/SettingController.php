<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateSettingsRequest;
use App\Models\Setting;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;

class SettingController extends Controller
{
    public function index(): JsonResponse
    {
        $keys = array_merge(config('marqetise.public_setting_keys'), ['notification_email']);
        $settings = Setting::query()->whereIn('key', $keys)->get()
            ->mapWithKeys(fn (Setting $setting) => [$setting->key => Setting::getValue($setting->key)]);

        return response()->json(['data' => $settings]);
    }

    public function update(UpdateSettingsRequest $request, AuditLogger $audit): JsonResponse
    {
        $public = config('marqetise.public_setting_keys');

        foreach ($request->validated('settings') as $key => $value) {
            if ($value === '') {
                $value = null;
            }

            Setting::putValue($key, $value, $key === 'notification_email' ? 'private' : 'general', in_array($key, $public, true));
        }

        $audit->log('settings.updated', null, ['keys' => array_keys($request->validated('settings'))]);

        return $this->index();
    }
}
