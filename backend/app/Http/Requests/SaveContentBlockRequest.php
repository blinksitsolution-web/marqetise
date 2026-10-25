<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\SanitizesStrings;
use App\Support\SafeText;
use App\Support\SameSitePath;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class SaveContentBlockRequest extends FormRequest
{
    use SanitizesStrings;

    public function authorize(): bool
    {
        return $this->user()?->hasPermission('content.manage') ?? false;
    }

    protected function prepareForValidation(): void
    {
        $this->sanitize(['key', 'group', 'label']);
        if (is_array($this->input('payload'))) {
            $this->merge(['payload' => SafeText::cleanMixed($this->input('payload'))]);
        }
    }

    public function rules(): array
    {
        return [
            'key' => [
                'required', 'string', 'max:80', 'regex:/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/',
                Rule::unique('content_blocks', 'key')->ignore($this->route('block')),
            ],
            'group' => ['required', Rule::in(['home', 'about', 'courses', 'contact', 'global'])],
            'label' => ['required', 'string', 'max:160'],
            'payload' => ['required', 'array'],
            'is_visible' => ['required', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:1000'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if (SameSitePath::invalidHrefs($this->input('payload')) !== []) {
                $validator->errors()->add('payload', 'Links in a content block must be a same-site path starting with /.');
            }
        });
    }
}
