<?php

namespace Tests\Feature;

use App\Support\GhanaPhone;
use PHPUnit\Framework\TestCase;

class GhanaPhoneTest extends TestCase
{
    public function test_valid_numbers_normalize_to_e164_and_format_for_display(): void
    {
        $cases = [
            ['0593535225', '+233593535225', '+233 59 353 5225'],
            ['059 353 5225', '+233593535225', '+233 59 353 5225'],
            ['059-353-5225', '+233593535225', '+233 59 353 5225'],
            ['+233593535225', '+233593535225', '+233 59 353 5225'],
            ['+233 59 353 5225', '+233593535225', '+233 59 353 5225'],
            ['233593535225', '+233593535225', '+233 59 353 5225'],
            ['0241234567', '+233241234567', '+233 24 123 4567'],
            ['(024) 123-4567', '+233241234567', '+233 24 123 4567'],
            ['+233.24.123.4567', '+233241234567', '+233 24 123 4567'],
            ['0201234567', '+233201234567', '+233 20 123 4567'],
            ['0301234567', '+233301234567', '+233 30 123 4567'],
            ['032 123 4567', '+233321234567', '+233 32 123 4567'],
        ];

        foreach ($cases as [$input, $e164, $display]) {
            $this->assertSame($e164, GhanaPhone::normalize($input), $input);
            $this->assertSame($display, GhanaPhone::format($input), $input);
            $this->assertSame($e164, GhanaPhone::prepare($input), $input);
        }
    }

    public function test_invalid_numbers_are_rejected_and_legacy_text_still_displays(): void
    {
        $invalid = [
            '+12025550123',
            '0211234567',
            '0221234567',
            '0291234567',
            '0511234567',
            '0521234567',
            '0581234567',
            '024123456',
            '241234567',
            'call me',
            '00233593535225',
            '+233059353522',
        ];

        foreach ($invalid as $input) {
            $this->assertNull(GhanaPhone::normalize($input), $input);
            $this->assertSame(trim($input), GhanaPhone::format($input), $input);
            $this->assertSame(trim($input), GhanaPhone::prepare($input), $input);
        }

        $this->assertNull(GhanaPhone::normalize(''));
        $this->assertNull(GhanaPhone::normalize(null));
        $this->assertNull(GhanaPhone::prepare('   '));
        $this->assertNull(GhanaPhone::format(null));
        $this->assertSame(GhanaPhone::MESSAGE, 'Enter a valid Ghanaian phone number, e.g. 024 123 4567 or +233 24 123 4567.');
    }
}
