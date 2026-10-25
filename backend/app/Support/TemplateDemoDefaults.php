<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;

class TemplateDemoDefaults
{
    /**
     * Demo copy taken from the public template. Published only when the block
     * is still the empty hidden shell, so live About, services, courses, and
     * settings are never replaced.
     *
     * @return list<array{key: string, group: string, label: string, sort_order: int, payload: array<string, mixed>}>
     */
    public static function blocks(): array
    {
        return [
            ['key' => 'home.stats', 'group' => 'home', 'label' => 'Statistics', 'sort_order' => 4, 'payload' => [
                'title' => "They Reveal the\nTrue Power of a\nCompany",
                'items' => [
                    ['value' => '230k', 'label' => 'Completed Projects'],
                    ['value' => '100%', 'label' => 'satisfied customers'],
                    ['value' => '960k', 'label' => 'Seo & impressions'],
                ],
            ]],
            ['key' => 'home.testimonials', 'group' => 'home', 'label' => 'Testimonials', 'sort_order' => 5, 'payload' => [
                'title' => 'What They’re Talking About Us?',
                'items' => [
                    ['quote' => 'I recently worked with Marqetise for my home renovation project, and I couldn\'t be happier with the results. From the moment I walked into their showroom, I was impressed by the extensive selection of high-quality.', 'name' => 'Jasmine Oubre', 'role' => 'managing director'],
                    ['quote' => 'I recently worked with Marqetise for my home renovation project, and I couldn\'t be happier with the results. From the moment I walked into their showroom, I was impressed by the extensive selection of high-quality.', 'name' => 'Blanche Spencer', 'role' => 'managing director'],
                    ['quote' => 'I recently worked with Marqetise for my home renovation project, and I couldn\'t be happier with the results. From the moment I walked into their showroom, I was impressed by the extensive selection of high-quality.', 'name' => 'Jose Dicus', 'role' => 'managing director'],
                ],
            ]],
            ['key' => 'home.projects', 'group' => 'home', 'label' => 'Projects', 'sort_order' => 8, 'payload' => [
                'title' => "Explore Our Marketing\nCase Studies",
                'items' => [
                    ['title' => "SEO Marketing\nResult Growth\nin Website", 'category' => 'Technology', 'summary' => 'More detail will be added here.', 'href' => '/project-details', 'image' => 'images/project/project-1-2.jpg', 'image_alt' => ''],
                    ['title' => "SEO Marketing\nResult Growth\nin Website", 'category' => 'Technology', 'summary' => 'More detail will be added here.', 'href' => '/project-details', 'image' => 'images/project/project-1-1.jpg', 'image_alt' => ''],
                    ['title' => "SEO Marketing\nResult Growth\nin Website", 'category' => 'Technology', 'summary' => 'More detail will be added here.', 'href' => '/project-details', 'image' => 'images/project/project-1-3.jpg', 'image_alt' => ''],
                ],
            ]],
            ['key' => 'home.team', 'group' => 'home', 'label' => 'Team', 'sort_order' => 9, 'payload' => [
                'title' => "Meet Our Executive\nTeam Members",
                'items' => [
                    ['name' => 'Kevin Martin', 'role' => 'Marketing Head', 'slug' => 'kevin-martin', 'bio' => '', 'image' => 'images/team/team-1-1.png', 'image_alt' => 'Kevin Martin'],
                    ['name' => 'Jessica Brown', 'role' => 'Marketing Head', 'slug' => 'jessica-brown', 'bio' => '', 'image' => 'images/team/team-1-2.png', 'image_alt' => 'Jessica Brown'],
                    ['name' => 'David Cooper', 'role' => 'Marketing Head', 'slug' => 'david-cooper', 'bio' => '', 'image' => 'images/team/team-1-3.png', 'image_alt' => 'David Cooper'],
                ],
            ]],
            ['key' => 'home.partners', 'group' => 'home', 'label' => 'Partner logos', 'sort_order' => 10, 'payload' => [
                'title' => "Trusted By\nTop Companies",
                'items' => [
                    ['name' => 'Partner', 'href' => '', 'image' => 'images/brand/brand-1-1.png', 'image_alt' => ''],
                    ['name' => 'Partner', 'href' => '', 'image' => 'images/brand/brand-1-2.png', 'image_alt' => ''],
                    ['name' => 'Partner', 'href' => '', 'image' => 'images/brand/brand-1-3.png', 'image_alt' => ''],
                    ['name' => 'Partner', 'href' => '', 'image' => 'images/brand/brand-1-4.png', 'image_alt' => ''],
                    ['name' => 'Partner', 'href' => '', 'image' => 'images/brand/brand-1-5.png', 'image_alt' => ''],
                ],
            ]],
            ['key' => 'home.news', 'group' => 'home', 'label' => 'News', 'sort_order' => 11, 'payload' => [
                'title' => "Read Latest News\n& Blog Posts",
                'items' => [
                    ['title' => 'From site structure to keyword optimization, we fine-tune to maximize your visibility.', 'date' => '20 May', 'summary' => '', 'href' => '/news-details', 'image' => 'images/blog/blog-1-1.jpg', 'image_alt' => 'Article'],
                    ['title' => 'Optimize content structure and keyword usage to improve your site’s SEO performance', 'date' => '20 May', 'summary' => '', 'href' => '/news-details', 'image' => 'images/blog/blog-1-2.jpg', 'image_alt' => 'Article'],
                    ['title' => 'From technical SEO to quality content, we optimize every step of your digital strategy', 'date' => '20 May', 'summary' => '', 'href' => '/news-details', 'image' => 'images/blog/blog-1-3.jpg', 'image_alt' => 'Article'],
                ],
            ]],
            ['key' => 'home.cta', 'group' => 'home', 'label' => 'Closing call to action', 'sort_order' => 12, 'payload' => [
                'title' => "Let’s Request a Schedule\nFor Free Consultation",
                'body' => 'Work with us on your next SEO project and watch your growth soar. Our SEO services aim to optimize operations and strategies, driving growth success.',
                'primary_label' => 'SEND MESSAGE',
                'primary_href' => '/contact',
                'secondary_label' => '',
                'secondary_href' => '',
                'form_title' => "Ready to grow?\nLet’s Start Your\nSEO Journey Together",
            ]],
            ['key' => 'packages.plans', 'group' => 'packages', 'label' => 'Packages', 'sort_order' => 1, 'payload' => [
                'title' => 'Packages',
                'intro' => '',
                'items' => [
                    ['name' => 'Basic Plan', 'price' => '$29', 'summary' => '', 'href' => '/contact'],
                    ['name' => 'Advanced Plan', 'price' => '$99', 'summary' => '', 'href' => '/contact'],
                    ['name' => 'Premium Plan', 'price' => '$199', 'summary' => '', 'href' => '/contact'],
                ],
            ]],
        ];
    }

    public static function sync(): void
    {
        $now = now();

        foreach (self::blocks() as $block) {
            $row = DB::table('content_blocks')->where('key', $block['key'])->first();

            if ($row && ! self::isUntouchedShell($row)) {
                continue;
            }

            $values = [
                'payload' => json_encode($block['payload']),
                'is_visible' => true,
                'updated_at' => $now,
            ];

            if ($row) {
                DB::table('content_blocks')->where('key', $block['key'])->update($values);

                continue;
            }

            DB::table('content_blocks')->insert($values + [
                'key' => $block['key'],
                'group' => $block['group'],
                'label' => $block['label'],
                'sort_order' => $block['sort_order'],
                'created_at' => $now,
            ]);
        }
    }

    public static function isUntouchedShell(object $row): bool
    {
        if ((bool) $row->is_visible) {
            return false;
        }

        $payload = json_decode((string) $row->payload, true);
        if (! is_array($payload)) {
            return true;
        }

        $items = $payload['items'] ?? [];
        if (is_array($items) && count($items) > 0) {
            return false;
        }

        foreach (['body', 'primary_label', 'headline', 'intro'] as $key) {
            if (trim((string) ($payload[$key] ?? '')) !== '') {
                return false;
            }
        }

        return true;
    }
}
