<?php

namespace App\Http\Requests;

use App\Support\MediaUpload;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\UploadedFile;

class UploadMediaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasPermission('media.manage') ?? false;
    }

    public function rules(): array
    {
        return [
            'file' => ['required', 'file', function (string $attribute, mixed $value, \Closure $fail): void {
                if (! $value instanceof UploadedFile) {
                    $fail('The file was not uploaded.');

                    return;
                }

                $problem = MediaUpload::rejection(MediaUpload::detectedMime($value->getPathname()), (int) $value->getSize());
                if ($problem !== null) {
                    $fail($problem);
                }
            }],
            'alt' => ['nullable', 'string', 'max:180'],
        ];
    }
}
