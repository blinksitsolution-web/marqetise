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
            'file' => ['required', 'file', 'mimes:jpg,jpeg,png,webp,svg,mp4,webm,mov,ogg', 'max:102400'],
            'alt' => ['nullable', 'string', 'max:180'],
        ];
    }
}
