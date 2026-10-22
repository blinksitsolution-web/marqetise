<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateInquiryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasPermission('inquiries.manage') ?? false;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', Rule::in(['new', 'in_progress', 'resolved'])],
        ];
    }
}
