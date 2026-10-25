<?php

namespace App\Http\Requests;

use App\Support\StatusTransition;
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

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            $inquiry = $this->route('inquiry');
            $next = (string) $this->input('status');

            if ($inquiry && ! StatusTransition::inquiry((string) $inquiry->status, $next)) {
                $validator->errors()->add('status', 'That status change is not allowed.');
            }
        });
    }
}
