<?php

namespace Database\Seeders;

use App\Models\Course;
use Illuminate\Database\Seeder;

class SampleCourseSeeder extends Seeder
{
    public function run(): void
    {
        $courses = [
            [
                'title' => 'Digital Marketing Fundamentals',
                'slug' => 'digital-marketing-fundamentals',
                'summary' => 'A starter course covering the main channels and how they fit together.',
                'category' => 'Digital Marketing',
                'level' => 'Beginner',
                'format' => 'Self-paced',
                'duration_label' => '6 weeks',
                'price' => 199,
                'featured' => false,
                'outcomes' => ['Describe how search, social, content, and paid media support one another', 'Write a simple plan for a small campaign'],
            ],
            [
                'title' => 'SEO Mastery',
                'slug' => 'seo-mastery',
                'summary' => 'Hands-on search work: technical checks, keywords, content, and reporting.',
                'category' => 'SEO',
                'level' => 'Intermediate',
                'format' => 'Online · Live',
                'duration_label' => '8 weeks',
                'price' => 349,
                'featured' => true,
                'certificate_included' => true,
                'outcomes' => ['Audit a site for common search issues', 'Build a keyword and content map', 'Report on what changed'],
                'modules' => [
                    ['title' => 'Foundations', 'lessons' => ['How search results are assembled', 'What you can and cannot control']],
                    ['title' => 'Research', 'lessons' => ['Finding demand', 'Choosing pages to improve']],
                    ['title' => 'On-page work', 'lessons' => ['Titles and headings', 'Internal links']],
                ],
            ],
            [
                'title' => 'Social Media Strategy',
                'slug' => 'social-media-strategy',
                'summary' => 'Plan a social presence with a reason for each channel and a publishing rhythm.',
                'category' => 'Social Media',
                'level' => 'Intermediate',
                'format' => 'Online',
                'duration_label' => '6 weeks',
                'price' => 249,
                'featured' => false,
                'outcomes' => ['Choose channels on purpose', 'Write a monthly content plan'],
            ],
            [
                'title' => 'Content Creation Bootcamp',
                'slug' => 'content-creation-bootcamp',
                'summary' => 'Produce useful marketing content and a simple editorial system.',
                'category' => 'Content Creation',
                'level' => 'Beginner',
                'format' => 'Hybrid',
                'duration_label' => '4 weeks',
                'price' => 249,
                'featured' => false,
                'outcomes' => ['Draft a page or post that answers a real question', 'Edit your own work against a checklist'],
            ],
            [
                'title' => 'Google & Meta Ads',
                'slug' => 'google-and-meta-ads',
                'summary' => 'Set up and read paid campaigns without treating early numbers as a promise.',
                'category' => 'Advertising',
                'level' => 'Intermediate',
                'format' => 'Live online',
                'duration_label' => '5 weeks',
                'price' => null,
                'price_label' => 'Contact for price',
                'featured' => true,
                'outcomes' => ['Structure a campaign around one offer', 'Read spend, clicks, and enquiries together'],
            ],
            [
                'title' => 'Analytics with GA4',
                'slug' => 'analytics-with-ga4',
                'summary' => 'Configure GA4 and build a short readout for marketing decisions.',
                'category' => 'Analytics',
                'level' => 'Intermediate',
                'format' => 'Online',
                'duration_label' => '5 weeks',
                'price' => 349,
                'featured' => false,
                'outcomes' => ['Check that key events are recorded', 'Explain a traffic change without inventing a cause'],
            ],
        ];

        foreach ($courses as $index => $course) {
            $modules = $course['modules'] ?? [
                ['title' => 'Overview', 'lessons' => ['How the course is organised', 'What to prepare']],
                ['title' => 'Practice', 'lessons' => ['Guided exercise', 'Review']],
            ];
            unset($course['modules']);

            $record = Course::query()->updateOrCreate(['slug' => $course['slug']], [
                ...$course,
                'description' => $course['summary'].' This starter record comes from the interface mockups and should be reviewed before it is treated as a live offer.',
                'status' => 'published',
                'sort_order' => $index,
                'certificate_included' => $course['certificate_included'] ?? false,
                'price_label' => $course['price_label'] ?? null,
            ]);

            $record->modules()->delete();
            foreach ($modules as $moduleIndex => $module) {
                $record->modules()->create([
                    'title' => $module['title'],
                    'lessons' => $module['lessons'],
                    'sort_order' => $moduleIndex,
                ]);
            }
        }
    }
}
