<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\SanitizesStrings;
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
        $this->merge(['email' => strtolower((string) $this->input('email'))]);
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:30', 'regex:/^[0-9+().\\-\\s]{6,30}$/'],
            'role_id' => ['required', 'integer', 'exists:roles,id'],
            'status' => ['required', Rule::in(['active', 'suspended'])],
            'send_invite' => ['sometimes', 'boolean'],
        ];
    }
}
