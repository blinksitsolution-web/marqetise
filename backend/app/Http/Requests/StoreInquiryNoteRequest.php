<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\SanitizesStrings;
use Illuminate\Foundation\Http\FormRequest;

class StoreInquiryNoteRequest extends FormRequest
{
    use SanitizesStrings;

    public function authorize(): bool
    {
        return $this->user()?->hasPermission('inquiries.manage') ?? false;
    }

    protected function prepareForValidation(): void
    {
        $this->sanitize(['body']);
    }

    public function rules(): array
    {
        return [
            'body' => ['required', 'string', 'min:2', 'max:2000'],
        ];
    }
}
