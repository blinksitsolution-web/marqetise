<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\SanitizesStrings;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class AccountUpdateRequest extends FormRequest
{
    use SanitizesStrings;

    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    protected function prepareForValidation(): void
    {
        $this->sanitize(['name', 'phone']);
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:120'],
            'phone' => ['nullable', 'string', 'max:30', 'regex:/^[0-9+().\\-\\s]{6,30}$/'],
            'current_password' => ['required_with:password', 'current_password'],
            'password' => ['nullable', 'confirmed', Password::defaults()],
        ];
    }
}
