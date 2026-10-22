<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\SanitizesStrings;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateBookingRequest extends FormRequest
{
    use SanitizesStrings;

    public function authorize(): bool
    {
        return $this->user()?->hasPermission('bookings.manage') ?? false;
    }

    protected function prepareForValidation(): void
    {
        $this->sanitize(['internal_notes', 'cancellation_reason']);
    }

    public function rules(): array
    {
        return [
            'status' => ['required', Rule::in(['pending', 'confirmed', 'completed', 'cancelled'])],
            'assigned_to' => ['nullable', 'integer', 'exists:users,id'],
            'internal_notes' => ['nullable', 'string', 'max:5000'],
            'cancellation_reason' => ['required_if:status,cancelled', 'nullable', 'string', 'max:300'],
        ];
    }
}
