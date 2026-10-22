<?php

namespace App\Http\Requests\Concerns;

use App\Support\SafeText;

trait SanitizesStrings
{
    protected function sanitize(array $fields): void
    {
        $clean = [];

        foreach ($fields as $field) {
            $value = $this->input($field);

            if (is_string($value)) {
                $clean[$field] = SafeText::clean($value);
            }
        }

        if ($clean !== []) {
            $this->merge($clean);
        }
    }
}
