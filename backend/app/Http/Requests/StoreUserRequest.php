<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\SanitizesStrings;
use App\Rules\GhanaianPhone;
use App\Support\GhanaPhone;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreUserRequest extends FormRequest
{
    use SanitizesStrings;

    public function authorize(): bool
    {
        return $this->user()?->hasPermission('users.manage') ?? false;
    }

    protected function prepareForValidation(): void
    {
        $this->sanitize(['name', 'email', 'phone']);
        GhanaPhone::mergeNormalized($this, 'phone');
        $this->merge(['email' => strtolower((string) $this->input('email'))]);
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['nullable', 'string', new GhanaianPhone],
            'role_id' => ['required', 'integer', 'exists:roles,id'],
            'status' => ['required', Rule::in(['active', 'suspended'])],
            'send_invite' => ['sometimes', 'boolean'],
        ];
    }
}
