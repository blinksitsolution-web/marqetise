<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UploadMediaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasPermission('media.manage') ?? false;
    }

    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'image', 'mimes:jpg,jpeg,png,webp,gif', 'max:5120'],
            'alt' => ['nullable', 'string', 'max:180'],
        ];
    }
}
