<?php

namespace App\Rules;

use App\Support\GhanaPhone;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class GhanaianPhone implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if ($value === null || $value === '') {
            return;
        }

        if (! is_string($value) || GhanaPhone::normalize($value) === null) {
            $fail(GhanaPhone::MESSAGE);
        }
    }
}
