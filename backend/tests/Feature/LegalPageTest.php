<?php

namespace Tests\Feature;

use App\Models\Page;
use App\Support\LegalCopy;
use Database\Seeders\WebsiteContentSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LegalPageTest extends TestCase
{
    use RefreshDatabase;

    public function test_privacy_and_terms_are_published_with_the_ghana_notices(): void
    {
        $this->seed(WebsiteContentSeeder::class);

        foreach (['privacy', 'terms'] as $slug) {
            $response = $this->getJson('/api/v1/pages/'.$slug)->assertOk();
            $body = (string) $response->json('data.body');

            $this->assertLessThanOrEqual(20000, strlen($body));
            $this->assertStringContainsString('Have a lawyer qualified in Ghana review this page', $body);
            $this->assertStringContainsString('courts of Ghana', $slug === 'terms' ? $body : LegalCopy::terms());
        }

        $privacy = $this->getJson('/api/v1/pages/privacy')->json('data.body');
        $this->assertStringContainsString('Data Protection Act, 2012 (Act 843)', $privacy);
        $this->assertStringContainsString('Electronic Transactions Act, 2008 (Act 772)', LegalCopy::terms());
        $this->assertStringContainsString('Cybersecurity Act, 2020 (Act 1038)', $privacy);
        $this->assertStringContainsString('[IP ADDRESS RETENTION PERIOD]', $privacy);
        $this->assertStringNotContainsString('google-analytics', strtolower($privacy));

        foreach (LegalCopy::PLACEHOLDERS as $placeholder) {
            $this->assertTrue(
                str_contains(LegalCopy::privacy(), $placeholder) || str_contains(LegalCopy::terms(), $placeholder),
                $placeholder.' is missing from the legal pages.',
            );
        }

        $slugs = collect($this->getJson('/api/v1/site')->assertOk()->json('data.pages'))->pluck('slug');
        $this->assertTrue($slugs->contains('privacy'));
        $this->assertTrue($slugs->contains('terms'));
    }

    public function test_a_draft_privacy_page_stays_off_the_public_api(): void
    {
        Page::query()->where('slug', 'privacy')->update([
            'status' => 'draft',
            'published_at' => null,
        ]);

        $this->getJson('/api/v1/pages/privacy')->assertNotFound();
        $slugs = collect($this->getJson('/api/v1/site')->assertOk()->json('data.pages'))->pluck('slug');
        $this->assertFalse($slugs->contains('privacy'));
    }

    public function test_a_finished_legal_page_is_not_replaced_by_a_later_publish(): void
    {
        Page::query()->where('slug', 'privacy')->update([
            'status' => 'published',
            'body' => 'Edited by the owner after legal review.',
        ]);

        LegalCopy::publish();

        $this->assertSame(
            'Edited by the owner after legal review.',
            Page::query()->where('slug', 'privacy')->value('body'),
        );
    }
}
