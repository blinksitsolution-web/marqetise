<?php

namespace App\Http\Requests;

use App\Http\Requests\Concerns\SanitizesStrings;
use App\Support\SafeText;
use App\Support\SameSitePath;
use App\Support\YouTubeUrl;
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
            $payload = SafeText::cleanMixed($this->input('payload'));
            if (is_array($payload)) {
                $payload = $this->normalizeVideo($payload);
            }
            $this->merge(['payload' => $payload]);
        }
    }

    /**
     * @param  array<mixed>  $payload
     * @return array<mixed>
     */
    private function normalizeVideo(array $payload): array
    {
        if (! array_key_exists('video_url', $payload)) {
            return $payload;
        }

        $url = $payload['video_url'];
        if (! is_string($url) || trim($url) === '') {
            $payload['video_url'] = '';

            return $payload;
        }

        $embed = YouTubeUrl::embed($url);
        if ($embed !== null) {
            $payload['video_url'] = $embed;
            $payload['video_kind'] = 'youtube';
            $payload['video_removed'] = false;

            return $payload;
        }

        if (SameSitePath::isAllowed($url) && preg_match('#^/media/\d+-[a-f0-9]{64}\.(?:mp4|webm|mov)$#', $url) === 1) {
            $payload['video_kind'] = 'file';
            $payload['video_removed'] = false;

            return $payload;
        }

        return $payload;
    }

    public function rules(): array
    {
        return [
            'key' => [
                'required', 'string', 'max:80', 'regex:/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/',
                Rule::unique('content_blocks', 'key')->ignore($this->route('block')),
            ],
            'group' => ['required', Rule::in(['home', 'about', 'courses', 'contact', 'global', 'services', 'faq', 'book', 'packages'])],
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

            $payload = $this->input('payload');
            $video = is_array($payload) ? ($payload['video_url'] ?? null) : null;
            if (is_string($video) && $video !== '' && YouTubeUrl::embed($video) === null && preg_match('#^/media/\d+-[a-f0-9]{64}\.(?:mp4|webm|mov)$#', $video) !== 1) {
                $validator->errors()->add('payload', 'The intro video must be a YouTube link or a video uploaded on this site.');
            }
        });
    }
}
