<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\SanitizesStrings;
use App\Rules\GhanaianPhone;
use App\Support\GhanaPhone;
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
        GhanaPhone::mergeNormalized($this, 'phone');
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:120'],
            'phone' => ['nullable', 'string', new GhanaianPhone],
            'current_password' => ['required_with:password', 'current_password'],
            'password' => ['nullable', 'confirmed', Password::defaults()],
        ];
    }
}
