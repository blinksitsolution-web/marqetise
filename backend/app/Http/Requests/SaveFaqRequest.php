<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\SanitizesStrings;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SaveFaqRequest extends FormRequest
{
    use SanitizesStrings;

    public function authorize(): bool
    {
        return $this->user()?->hasPermission('content.manage') ?? false;
    }

    protected function prepareForValidation(): void
    {
        $this->sanitize(['question', 'answer', 'context']);
    }

    public function rules(): array
    {
        return [
            'context' => ['required', Rule::in(['home', 'about', 'courses', 'contact'])],
            'question' => ['required', 'string', 'max:200'],
            'answer' => ['required', 'string', 'max:2000'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:1000'],
            'is_published' => ['required', 'boolean'],
        ];
    }
}
