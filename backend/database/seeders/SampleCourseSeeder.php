<?php

namespace Database\Seeders;

use App\Models\Course;
use Illuminate\Database\Seeder;

class SampleCourseSeeder extends Seeder
{
    public function run(): void
    {
        // Delete older dummy courses if needed or update them
        Course::query()->whereIn('slug', [
            'digital-marketing-fundamentals',
            'seo-mastery',
            'social-media-strategy',
            'content-creation-bootcamp',
            'google-and-meta-ads',
            'analytics-with-ga4',
        ])->delete();

        $courses = [
            [
                'title' => "Digital Marketing Starter's Class",
                'slug' => 'digital-marketing-starters-class',
                'summary' => 'Equip learners with foundational practical digital marketing skills across 8 intensive weeks of hands-on strategy, execution, and portfolio building.',
                'description' => "The Digital Marketing Starter's Class is Marqetise Academy's flagship program designed to take aspiring marketers and entrepreneurs from fundamentals to full-funnel execution. Delivered in-person and online across 8 structured weeks, you will master organic social media, content creation, Canva design, live Meta ads setup, analytics, SEO, and client portfolio packaging.",
                'category' => 'Digital Marketing',
                'level' => 'Beginner',
                'format' => 'In-person & Online',
                'duration_label' => '8-Weeks',
                'price' => 1200,
                'price_label' => 'GHS 1,200',
                'featured' => true,
                'status' => 'published',
                'certificate_included' => true,
                'outcomes' => [
                    'Master platform essentials and algorithms across TikTok, Instagram, Facebook, LinkedIn, and X',
                    'Plan, write, and shoot scroll-stopping content, hooks, and video scripts',
                    'Design branded social media content packs using Canva',
                    'Set up and manage live Meta advertising campaigns with strategic audience targeting',
                    'Interpret performance data and build monthly executive analytics reports',
                    'Implement on-page SEO best practices and website optimization',
                    'Package skills into a client-ready portfolio with pricing, invoicing, and interview preparation',
                ],
                'modules' => [
                    [
                        'title' => 'WEEK 1 — DIGITAL MARKETING FOUNDATIONS',
                        'lessons' => [
                            'Introduction to Digital Marketing',
                            'Digital Marketing Channels',
                            'Branding Fundamentals',
                            'Consumer Psychology Basics',
                            'Content Pillars & Messaging',
                        ],
                    ],
                    [
                        'title' => 'WEEK 2 — SOCIAL MEDIA MARKETING',
                        'lessons' => [
                            'Platform Essentials (TikTok, IG, FB, LinkedIn, X)',
                            'Understanding Algorithms',
                            'Audience Research',
                            'Content Types & Formats',
                            'Building Content Pillars (Practical)',
                        ],
                    ],
                    [
                        'title' => 'WEEK 3 — CONTENT CREATION',
                        'lessons' => [
                            'Writing for Digital',
                            'Hooks, Storytelling, CTA',
                            'Caption Writing',
                            'Scriptwriting for TikTok/Reels',
                            'Video Production Basics (Phone Editing)',
                            'Practical Video Creation',
                        ],
                    ],
                    [
                        'title' => 'WEEK 4 — DESIGN ESSENTIALS',
                        'lessons' => [
                            'Canva: Beginner → Intermediate',
                            'Principles of Good Design',
                            'Social Media Design (Posters, Carousels, Flyers)',
                            'Practical: Branded Content Pack',
                        ],
                    ],
                    [
                        'title' => 'WEEK 5 — ADS & PAID PROMOTION',
                        'lessons' => [
                            'Introduction to Paid Ads',
                            'Facebook/Meta Ads Structure',
                            'Audience Targeting',
                            'Ad Creatives',
                            'Practical: Live Ad Setup Demo',
                        ],
                    ],
                    [
                        'title' => 'WEEK 6 — ANALYTICS & REPORTING',
                        'lessons' => [
                            'Metrics That Matter',
                            'Reading Meta, IG & TikTok Insights',
                            'Monthly Reporting Structure',
                            'Data Interpretation & Recommendations',
                            'Practical: Build a Sample Report',
                        ],
                    ],
                    [
                        'title' => 'WEEK 7 — SEO & WEBSITE BASICS',
                        'lessons' => [
                            'How Search Engines Work',
                            'On-Page SEO',
                            'Keyword Research',
                            'Essential Website Pages & Best Practices',
                            'Practical: Optimize a Page for SEO',
                        ],
                    ],
                    [
                        'title' => 'WEEK 8 — PORTFOLIO & CAREER DEVELOPMENT',
                        'lessons' => [
                            'Packaging Your Skills',
                            'Building a Beginner Portfolio',
                            'Client Management & Communication',
                            'Pricing & Invoicing',
                            'Interview Preparation',
                            'Practical: Portfolio Presentation + Mock Interview',
                        ],
                    ],
                ],
            ],
            [
                'title' => 'Storytelling Content Creation',
                'slug' => 'storytelling-content-creation',
                'summary' => 'Help learners use storytelling to develop more engaging, purposeful, and high-converting content across digital platforms.',
                'description' => "Great content isn't about algorithms—it's about empathy, hooks, and narrative resonance. In this intensive 1-Week Hybrid masterclass, you will learn the Story-First Mindset, how to craft stories that sell, smartphone videography, lighting, audio, and CapCut editing psychology, concluding with your own 30-day publishing roadmap.",
                'category' => 'Content Creation',
                'level' => 'All Levels',
                'format' => 'Hybrid',
                'duration_label' => '1 Week',
                'price' => 500,
                'price_label' => 'GHS 500',
                'featured' => true,
                'status' => 'published',
                'certificate_included' => true,
                'outcomes' => [
                    'Adopt a story-first creator mindset and uncover compelling narratives hidden in your skill',
                    'Master the anatomy of stories that sell with high-retention hooks and short-form scripts',
                    'Produce professional-grade smartphone video with cinematic lighting, crisp audio, and b-roll',
                    'Apply editing psychology using CapCut with purposeful pacing, music, and captions',
                    'Build your personal brand and launch a sustainable 30-day publishing challenge',
                ],
                'modules' => [
                    [
                        'title' => 'PART I — THE STORY-FIRST MINDSET',
                        'lessons' => [
                            'Chapter 1: Why Stories Matter',
                            'Chapter 2: Becoming a Story-First Creator',
                            'Chapter 3: Finding Stories Hidden in Your Skill',
                        ],
                    ],
                    [
                        'title' => 'PART II — CREATING STORIES THAT SELL',
                        'lessons' => [
                            'Chapter 4: The Anatomy of a Great Story',
                            'Chapter 5: Understanding Your Audience',
                            'Chapter 6: Writing Hooks That Stop the Scroll',
                            'Chapter 7: Script writing for Short-Form Content',
                            'Chapter 8: Storyboarding Your Vision',
                        ],
                    ],
                    [
                        'title' => 'PART III — BRINGING STORIES TO LIFE',
                        'lessons' => [
                            'Chapter 9: Smartphone Videography',
                            'Chapter 10: Lighting and Composition',
                            'Chapter 11: Audio That Builds Trust',
                            'Chapter 12: Capturing B-Roll',
                        ],
                    ],
                    [
                        'title' => 'PART IV — EDITING PSYCHOLOGY',
                        'lessons' => [
                            'Chapter 13: Editing with Purpose',
                            'Chapter 14: CapCut Workflow',
                            'Chapter 15: Music, Captions & Pacing',
                        ],
                    ],
                    [
                        'title' => 'PART V — BECOMING A CREATOR',
                        'lessons' => [
                            'Chapter 16: Building Your Personal Brand',
                            'Chapter 17: Publishing Strategy',
                            'Chapter 18: The 30-Day Challenge',
                            'Chapter 19: Becoming a Lifelong Story-First Creator',
                        ],
                    ],
                ],
            ],
        ];

        foreach ($courses as $index => $course) {
            $modules = $course['modules'] ?? [];
            unset($course['modules']);

            $record = Course::query()->updateOrCreate(['slug' => $course['slug']], [
                ...$course,
                'sort_order' => $index,
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
