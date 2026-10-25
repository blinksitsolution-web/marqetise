<?php

namespace Database\Seeders;

use App\Models\ContentBlock;
use App\Models\Faq;
use App\Models\MediaAsset;
use App\Models\Page;
use App\Models\Service;
use App\Models\User;
use Illuminate\Database\Seeder;

class WebsiteContentSeeder extends Seeder
{
    public function run(): void
    {
        $this->pages();
        $this->services();
        $this->blocks();
        $this->faqs();
        $this->mediaAssets();
    }

    private function pages(): void
    {
        $pages = [
            [
                'title' => 'Experts in SEO & Digital Growth',
                'slug' => 'home',
                'excerpt' => 'Beyond Marketing · Storytelling-led digital solutions, Academy training, and cybersecurity capabilities.',
                'body' => 'Marqetise is a storytelling-led digital solutions business established to help businesses grow, equip people with practical digital skills and progressively build capabilities in responsible digital practices and cybersecurity.',
            ],
            [
                'title' => 'About Us',
                'slug' => 'about',
                'excerpt' => 'A storytelling-led digital solutions company operating under the tagline Beyond Marketing.',
                'body' => "Marqetise is a storytelling-led digital solutions business established to help businesses grow, equip people with practical digital skills and progressively build capabilities in responsible digital practices and cybersecurity.\n\nOperating under the tagline “Beyond Marketing,” Marqetise combines three complementary business units:\n\n• Marqetise Digital Growth — digital marketing, brand strategy, content creation, advertising and related growth services.\n• Marqetise Academy — practical digital skills education and professional training.\n• Marqetise Cybersecurity — a developing business unit focused on building competence and validating demand for digital safety, cybersecurity awareness and, in later stages, appropriate governance, risk and compliance support.\n\nThe business began on 19th March 2025 as DigiGrowth Hub, evolved through Alira Digital and Akéya Digital, and adopted the Marqetise brand in September 2025.",
            ],
            [
                'title' => 'Contact Us',
                'slug' => 'contact',
                'excerpt' => 'Start a conversation with Marqetise Digital Growth or Academy.',
                'body' => 'Use the contact form to discuss services, corporate workshops, or Academy courses. Our team responds within one business day.',
            ],
            ['title' => 'Privacy', 'slug' => 'privacy', 'excerpt' => 'How inquiry details are handled.', 'body' => 'Marqetise stores the details you submit so the team can reply. Do not send confidential passwords or information you are not comfortable storing.'],
            ['title' => 'Terms', 'slug' => 'terms', 'excerpt' => 'Terms of service and enrollment policies.', 'body' => 'Course enrolment requests submitted via the site are admissions inquiries and are reviewed by our team before confirmation.'],
            ['title' => 'Courses', 'slug' => 'courses', 'excerpt' => 'Courses for working marketers, operators, and teams. Enrolment is a request to the team, not an online payment.', 'body' => 'Browse published Academy courses. An enquiry does not take payment or reserve a place.'],
            ['title' => 'Service Grid', 'slug' => 'services', 'excerpt' => 'Digital growth services published by Marqetise.', 'body' => 'Service names and summaries on this page come from the services published in the CMS.'],
            ['title' => 'News Grid', 'slug' => 'news', 'excerpt' => 'News and articles.', 'body' => ''],
            ['title' => 'News Details', 'slug' => 'news-article', 'excerpt' => '', 'body' => ''],
            ['title' => 'FAQ', 'slug' => 'faq', 'excerpt' => 'Answers published in the CMS.', 'body' => ''],
            ['title' => 'Project Grid', 'slug' => 'projects', 'excerpt' => '', 'body' => ''],
            ['title' => 'Project Details', 'slug' => 'project-details', 'excerpt' => '', 'body' => ''],
            ['title' => 'Meet Our Expert', 'slug' => 'team', 'excerpt' => '', 'body' => ''],
            ['title' => 'Team Details', 'slug' => 'team-member', 'excerpt' => '', 'body' => ''],
            ['title' => 'Testimonial', 'slug' => 'testimonials', 'excerpt' => '', 'body' => ''],
            ['title' => 'Service Details', 'slug' => 'service-details', 'excerpt' => '', 'body' => ''],
            ['title' => 'Packages', 'slug' => 'packages', 'excerpt' => '', 'body' => ''],
            ['title' => 'Course', 'slug' => 'course-details', 'excerpt' => '', 'body' => ''],
        ];

        foreach ($pages as $page) {
            $legal = in_array($page['slug'], ['privacy', 'terms'], true);

            Page::query()->updateOrCreate(['slug' => $page['slug']], [
                ...$page,
                'status' => $legal ? 'draft' : 'published',
                'published_at' => $legal ? null : now(),
                'meta_title' => $page['title'].' · Marqetise | Beyond Marketing',
                'meta_description' => $page['excerpt'],
            ]);
        }
    }

    private function services(): void
    {
        // Clean out previous placeholder services
        Service::query()->whereNotIn('slug', [
            'social-media-strategy-and-management',
            'brand-strategy-and-identity',
            'content-creation-and-copywriting',
            'paid-advertising',
            'digital-campaigns-and-optimization',
            'workshops-and-consultations',
        ])->delete();

        $services = [
            [
                'name' => 'Social media strategy and management',
                'slug' => 'social-media-strategy-and-management',
                'icon' => 'share',
                'summary' => 'Audits, platform-specific strategies, editorial calendar planning, caption writing, and community engagement.',
                'description' => "• Social media audits.\n• Platform-specific strategies (Instagram, TikTok, LinkedIn, Facebook, X).\n• Content planning and calendar development.\n• Caption writing and content publishing.\n• Community engagement planning.\n• Performance reporting and recommendations.",
                'duration_label' => 'Monthly Retainer',
            ],
            [
                'name' => 'Brand strategy and identity',
                'slug' => 'brand-strategy-and-identity',
                'icon' => 'sparkles',
                'summary' => 'Brand positioning, messaging architecture, brand voice development, and visual identity guidance.',
                'description' => "• Brand positioning and messaging.\n• Brand voice development.\n• Logo and visual identity services.\n• Brand consistency guidance.\n• Strategic brand communication.",
                'duration_label' => 'Project-Based',
            ],
            [
                'name' => 'Content creation and copywriting',
                'slug' => 'content-creation-and-copywriting',
                'icon' => 'pen',
                'summary' => 'Storytelling-led social media content, short-form video concepts & scripts, campaign messaging, and web copy.',
                'description' => "• Social media content.\n• Short-form video concepts and scripts (TikTok & Reels).\n• Campaign messaging.\n• Website and promotional copy.\n• Storytelling-led brand content.",
                'duration_label' => 'Campaign or Retainer',
            ],
            [
                'name' => 'Paid advertising',
                'slug' => 'paid-advertising',
                'icon' => 'megaphone',
                'summary' => 'Targeted advertising across Meta, Google, LinkedIn, and TikTok with strategic conversion optimization.',
                'description' => "• Meta advertising (Facebook & Instagram).\n• Google advertising (Search & Display).\n• LinkedIn advertising (B2B demand gen).\n• TikTok advertising, where suitable.\n• Campaign planning, execution and optimization within the agreed scope.",
                'duration_label' => 'Monthly Management',
            ],
            [
                'name' => 'Digital campaigns and optimization',
                'slug' => 'digital-campaigns-and-optimization',
                'icon' => 'trendingUp',
                'summary' => 'Email marketing, search engine optimization (SEO), website conversion optimization, and analytics.',
                'description' => "• Email and digital campaigns.\n• Search engine optimization (SEO).\n• Website content and conversion optimization.\n• Campaign performance analysis.",
                'duration_label' => 'Quarterly or Ongoing',
            ],
            [
                'name' => 'Workshops and consultations',
                'slug' => 'workshops-and-consultations',
                'icon' => 'users',
                'summary' => 'Hands-on marketing workshops, executive brand consultations, and team content creation training.',
                'description' => "• Digital marketing workshops.\n• Brand and social media consultations.\n• Content creation training for teams and professionals.",
                'duration_label' => 'Half-day / Multi-day',
            ],
        ];

        foreach ($services as $index => $service) {
            Service::query()->updateOrCreate(['slug' => $service['slug']], [
                ...$service,
                'status' => 'published',
                'sort_order' => $index,
            ]);
        }
    }

    private function blocks(): void
    {
        $blocks = [
            ['key' => 'home.hero', 'group' => 'home', 'label' => 'Home hero video & display', 'sort_order' => 1, 'is_visible' => true, 'payload' => [
                'video_type' => 'mp4',
                'video_url' => 'https://wearesocial.com/us/wp-content/uploads/sites/3/2026/01/New-2025-EOY-Sizzle.mp4',
                'youtube_url' => '',
                'headline' => 'MARQETISE',
                'badge' => 'Beyond Marketing · Storytelling-Led Digital Solutions',
                'subcopy' => 'A storytelling-led digital solutions company established to help businesses grow, equip people with practical digital skills, and progressively build capabilities in responsible digital practices and cybersecurity.',
                'primary_label' => 'Explore services',
                'primary_href' => '/services',
                'secondary_label' => 'Marqetise Academy',
                'secondary_href' => '/courses',
            ]],
            ['key' => 'home.statement', 'group' => 'home', 'label' => 'Agency statement', 'sort_order' => 2, 'is_visible' => true, 'payload' => [
                'headline' => 'Operating Beyond Marketing — An Integrated African Digital Solutions Company with Global Reach.',
                'body' => 'Marqetise is a storytelling-led digital solutions business combining three complementary business units: Marqetise Digital Growth, Marqetise Academy, and Marqetise Cybersecurity. Our distinguishing principle is to look beyond individual deliverables and consider the strategy, systems, skills and responsible practices needed to achieve meaningful outcomes.',
                'highlight' => 'Strategy, systems, skills and responsible practices.',
                'point1' => 'Digital Growth & Academy: Full-service digital marketing, brand strategy, paid advertising, and practical cohort training.',
                'point2' => 'Responsible Digital Practices: Building competence and validating demand for digital safety, cybersecurity awareness, and governance.',
                'button_label' => 'OUR STORY & PURPOSE',
                'button_href' => '/about',
                'media_url' => 'https://wearesocial.com/us/wp-content/uploads/sites/3/2025/01/adidas-iphone-1.gif',
            ]],
            ['key' => 'home.work', 'group' => 'home', 'label' => 'Our work (Case studies)', 'sort_order' => 3, 'is_visible' => true, 'payload' => [
                'title' => 'Our Work',
                'button_label' => 'See all capabilities',
                'button_href' => '/services',
                'items' => [
                    [
                        'id' => 'jeopardy',
                        'title' => 'JEOPARDY! YOUTUBE EDITION',
                        'client' => 'Sony',
                        'category' => 'Entertainment',
                        'region' => 'United States',
                        'image' => 'https://wearesocial.com/us/wp-content/uploads/sites/3/2026/05/WAS-US-Jeopardy-YouTube-Edition-1024x576.jpg',
                        'excerpt' => 'For 60 years, Jeopardy! has been the ultimate arbiter of intellectual authority. But that authority was trapped in a demographic cul-de-sac. To evolve, Jeopardy! didn’t just need a new audience; it needed to validate a new era of intelligence.',
                        'href' => '/services',
                    ],
                    [
                        'id' => 'tripadvisor',
                        'title' => 'TRIPADVISOR | FROM BOOMER PARADISE TO GEN Z HOTSPOT',
                        'client' => 'Tripadvisor',
                        'category' => 'Travel',
                        'region' => 'United States',
                        'image' => 'https://wearesocial.com/us/wp-content/uploads/sites/3/2025/11/g-91360610-Tripadvisor-brand-refresh-july-2025.gif',
                        'excerpt' => 'Tripadvisor needed to reconnect with a generation that discovers the world through swipes, creators, and community—not guidebooks. The challenge: evolve a brand long associated with Boomers into a social-first travel companion for Gen Z and Zillennials.',
                        'href' => '/services',
                    ],
                    [
                        'id' => 'mcdonalds-trip',
                        'title' => 'MCDONALD’S | A TRIP TO MCDONALDLAND',
                        'client' => "McDonald's",
                        'category' => 'Food & Drink',
                        'region' => 'United States',
                        'image' => 'https://wearesocial.com/us/wp-content/uploads/sites/3/2025/12/Screenshot-2025-12-08-at-6.33.50-PM-1024x364.png',
                        'excerpt' => 'We set out to rebuild McDonaldland for the modern fan—rooted in culture, amplified socially, and designed for discovery.',
                        'href' => '/services',
                    ],
                    [
                        'id' => 'adidas-superbowl',
                        'title' => 'THE ADIDAS SUPER BOWL WINNING THROW',
                        'client' => 'adidas',
                        'category' => 'Sports',
                        'region' => 'United States',
                        'image' => 'https://wearesocial.com/us/wp-content/uploads/sites/3/2024/08/Adi-Sphere_2-1024x576.png',
                        'excerpt' => 'Committed to pushing the boundaries of sports marketing and reshaping the narrative around high-pressure athlete moments, we embraced the challenge of launching adidas’ bold new brand campaign during the Super Bowl.',
                        'href' => '/services',
                    ],
                    [
                        'id' => 'four-seasons-baby',
                        'title' => 'FOUR SEASONS ‘FULLY CONSCIOUS BABY’',
                        'client' => 'Four Seasons',
                        'category' => 'Travel',
                        'region' => 'Canada',
                        'image' => 'https://wearesocial.com/us/wp-content/uploads/sites/3/2024/10/Four-baby-memes-1024x598.png',
                        'excerpt' => 'With the TikTok masses waiting on tenterhooks, it was Four Seasons’ moment to move the story forward and transform a fleeting micro-trend into a lasting connection with Millennial audiences.',
                        'href' => '/services',
                    ],
                    [
                        'id' => 'gran-centenario',
                        'title' => 'GRAN CENTENARIO TEQUILA | DON’T BE A GRINGO',
                        'client' => 'Proximo Spirits',
                        'category' => 'Alcohol & Spirits',
                        'region' => 'United States',
                        'image' => 'https://wearesocial.com/us/wp-content/uploads/sites/3/2025/05/Screenshot-2025-05-14-at-2.31.55%E2%80%AFPM-1024x572.png',
                        'excerpt' => 'Gran Centenario is Mexico’s #1 tequila—but in the crowded U.S. tequila market, it was getting lost among countless Americanized "gringo" brands. Our challenge: Develop a distinct brand strategy and multi-channel campaign honoring heritage.',
                        'href' => '/services',
                    ],
                    [
                        'id' => 'wcdonalds-anime',
                        'title' => 'WCDONALD’S IMMERSIVE DINING EXPERIENCE',
                        'client' => "McDonald's",
                        'category' => 'Food & Culture',
                        'region' => 'United States',
                        'image' => 'https://wearesocial.com/us/wp-content/uploads/sites/3/2025/04/WcDonalds-1024x726.jpg',
                        'excerpt' => 'Anime culture was calling, so McDonald’s answered. Since anime fans go all-in, we brought WcDonald’s to life in an epic immersive dining experience across digital and physical touchpoints.',
                        'href' => '/services',
                    ],
                ],
            ]],
            ['key' => 'home.reports', 'group' => 'home', 'label' => 'Our reports & intelligence', 'sort_order' => 4, 'is_visible' => true, 'payload' => [
                'title' => 'Our Reports',
                'subtitle' => 'Authoritative data and strategic intelligence across the entire global digital and social landscape.',
                'items' => [
                    [
                        'id' => 'digital-2027',
                        'title' => 'Digital 2027',
                        'tag' => 'Reports',
                        'date' => '21 Oct 2026',
                        'image' => 'https://wearesocial.com/us/wp-content/uploads/sites/3/2026/10/WAS-GLOBAL-REPORT-2027-1024x512.jpg',
                        'href' => '/contact?subject=Digital%202027%20Report',
                    ],
                    [
                        'id' => 'think-forward-2026',
                        'title' => 'Think Forward 2026',
                        'tag' => 'Reports',
                        'date' => '22 Jan 2026',
                        'image' => 'https://wearesocial.com/us/wp-content/uploads/sites/3/2026/01/TF_2026_Hero_image-1024x512.jpg',
                        'href' => '/contact?subject=Think%20Forward%202026',
                    ],
                    [
                        'id' => 'digital-2026-us',
                        'title' => 'Digital 2026: In The U.S. 🇺🇸',
                        'tag' => 'Reports',
                        'date' => '5 Nov 2025',
                        'image' => 'https://wearesocial.com/us/wp-content/uploads/sites/3/2025/11/Digital-2026-1024x578.png',
                        'href' => '/contact?subject=Digital%202026%20US',
                    ],
                    [
                        'id' => 'digital-2026-global',
                        'title' => 'Digital 2026',
                        'tag' => 'Reports',
                        'date' => '15 Oct 2025',
                        'image' => 'https://wearesocial.com/us/wp-content/uploads/sites/3/2025/10/GDR-2026-1920x1080-1-1024x576.jpg',
                        'href' => '/contact?subject=Global%20Digital%20Report',
                    ],
                ],
            ]],
            ['key' => 'home.popup', 'group' => 'home', 'label' => 'Floating report banner', 'sort_order' => 5, 'is_visible' => true, 'payload' => [
                'is_enabled' => true,
                'badge' => 'Latest Release',
                'title' => 'DIGITAL 2027 IS HERE',
                'description' => 'Get Digital 2027 now, the latest in our Global Digital Report Series. Download your copy to discover essential data across the entire digital landscape.',
                'button_label' => 'DOWNLOAD NOW',
                'button_href' => '/contact?subject=Digital%202027%20Download',
            ]],
            ['key' => 'home.why', 'group' => 'home', 'label' => 'Why Marqetise', 'sort_order' => 6, 'is_visible' => true, 'payload' => [
                'title' => 'Why businesses choose Marqetise',
                'items' => [
                    ['title' => 'One team for both', 'body' => 'Client work and training sit together, so the people teaching the work also practise it.'],
                    ['title' => 'Clear priorities', 'body' => 'Engagements start with the outcome you need, then the channels that can support it.'],
                    ['title' => 'Work you can review', 'body' => 'You see the plan, the activity, and the questions still open. Nothing is presented as a guaranteed result.'],
                    ['title' => 'Practical training', 'body' => 'Courses are built for marketers and operators who need to use the skill, not only hear about it.'],
                ],
            ]],
            ['key' => 'home.process', 'group' => 'home', 'label' => 'Process', 'sort_order' => 7, 'is_visible' => true, 'payload' => [
                'title' => 'A simple process',
                'items' => [
                    ['title' => 'Discover', 'body' => 'We learn the offer, the audience, and what a useful result looks like.'],
                    ['title' => 'Plan', 'body' => 'We choose the work, the order, and how it will be reviewed.'],
                    ['title' => 'Execute', 'body' => 'The campaign, site, or training runs with a named owner.'],
                    ['title' => 'Review', 'body' => 'We look at what happened and decide the next step with you.'],
                ],
            ]],
            ['key' => 'home.focus', 'group' => 'home', 'label' => 'Home focus areas', 'sort_order' => 2, 'is_visible' => true, 'payload' => [
                'title' => 'What we work on',
                'items' => [
                    ['title' => 'Search', 'body' => 'Search visibility and the pages that should earn it.'],
                    ['title' => 'Content', 'body' => 'Content that answers a real question.'],
                    ['title' => 'Paid media', 'body' => 'Paid campaigns tied to a budget and an offer.'],
                    ['title' => 'Training', 'body' => 'Courses and team training that a person reviews.'],
                ],
            ]],
            ['key' => 'home.stats', 'group' => 'home', 'label' => 'Statistics', 'sort_order' => 4, 'is_visible' => false, 'payload' => [
                'title' => 'Results',
                'items' => [],
                'note' => 'Leave this hidden until real figures are supplied. Do not publish placeholder statistics.',
            ]],
            ['key' => 'home.testimonials', 'group' => 'home', 'label' => 'Testimonials', 'sort_order' => 5, 'is_visible' => false, 'payload' => [
                'title' => 'What clients and students say',
                'subtitle' => 'Published quotes only — no placeholder testimonials on the public site.',
                'items' => [],
                'note' => 'Add a testimonial only when you have permission to publish it.',
            ]],
            ['key' => 'home.team', 'group' => 'home', 'label' => 'Team', 'sort_order' => 8, 'is_visible' => false, 'payload' => [
                'title' => 'Meet Our Team',
                'subtitle' => 'Our professionals',
                'items' => [],
                'note' => 'Admin fields per member: name, role, image (media path or URL), linkedin. Set is_visible true when at least one member is ready to publish.',
            ]],
            ['key' => 'home.blog', 'group' => 'home', 'label' => 'Blog / news', 'sort_order' => 9, 'is_visible' => false, 'payload' => [
                'title' => 'Read Latest News & Blog Posts',
                'items' => [],
                'note' => 'Each item: title, category, date (e.g. "20 May"), image, href (internal path or URL), optional author.',
            ]],
            ['key' => 'about.identity', 'group' => 'about', 'label' => 'Identity, Vision & Mission', 'sort_order' => 1, 'is_visible' => true, 'payload' => [
                'title' => 'Beyond Marketing',
                'tagline' => 'A storytelling-led digital solutions company',
                'body' => 'Marqetise is a storytelling-led digital solutions business established to help businesses grow, equip people with practical digital skills and progressively build capabilities in responsible digital practices and cybersecurity.',
                'vision' => 'To become a trusted African digital solutions company with global reach, recognized for driving business growth, developing digital talent and advancing responsible digital practices.',
                'mission' => 'To help businesses grow, empower people through practical digital education, and enable organizations to navigate the digital landscape with greater confidence through strategic, creative and responsible solutions.',
                'brand_positioning' => 'Marqetise is a storytelling-led digital solutions company helping businesses grow, equipping people with practical digital skills, and developing capabilities that help organizations navigate digital risks.',
                'distinguishing_principle' => 'Our distinguishing principle is to look beyond individual deliverables and consider the strategy, systems, skills and responsible practices needed to achieve meaningful outcomes.',
                'values' => [
                    [
                        'title' => 'Excellence',
                        'body' => 'Deliver thoughtful, high-quality work and continually improve standards.',
                    ],
                    [
                        'title' => 'Growth',
                        'body' => 'Pursue sustainable business growth while helping clients and learners progress.',
                    ],
                    [
                        'title' => 'Integrity',
                        'body' => 'Communicate honestly, honour commitments and represent capabilities accurately.',
                    ],
                    [
                        'title' => 'Innovation',
                        'body' => 'Explore useful ideas, tools and methods that solve real problems.',
                    ],
                    [
                        'title' => 'Impact',
                        'body' => 'Prioritize measurable value for clients, learners and the wider community.',
                    ],
                    [
                        'title' => 'Lifelong learning',
                        'body' => 'Build knowledge continuously and adapt to changing digital environments.',
                    ],
                ],
            ]],
            ['key' => 'about.business_units', 'group' => 'about', 'label' => 'Three Business Units', 'sort_order' => 2, 'is_visible' => true, 'payload' => [
                'title' => 'Three Complementary Business Units',
                'subtitle' => 'Integrated capabilities uniting commercial expansion, practical education, and digital resilience.',
                'units' => [
                    [
                        'name' => 'Marqetise Digital Growth',
                        'tag' => 'Commercial Growth',
                        'summary' => 'Digital marketing, brand strategy, content creation, advertising and related growth services designed to expand market share and client revenue.',
                        'status' => 'Core Active Service',
                        'focus' => 'Immediate commercial priority: strengthen Digital Growth, increase recurring client revenue, improve cash collection and establish more predictable operations.',
                    ],
                    [
                        'name' => 'Marqetise Academy',
                        'tag' => 'Practical Training',
                        'summary' => 'Practical digital skills education and professional training delivering repeatable cohorts, certified curricula, and career-ready portfolios.',
                        'status' => 'Repeatable Delivery',
                        'focus' => 'Immediate focus: repeatable training delivery and reliable enrolment processes for aspiring marketers and corporate teams.',
                    ],
                    [
                        'name' => 'Marqetise Cybersecurity',
                        'tag' => 'Digital Safety & GRC',
                        'summary' => 'A developing business unit focused on building competence and validating demand for digital safety, cybersecurity awareness and appropriate governance, risk and compliance support.',
                        'status' => 'Developing Unit',
                        'focus' => 'Introduced progressively as the necessary knowledge, experience, demand and delivery capacity mature.',
                    ],
                ],
            ]],
            ['key' => 'about.timeline', 'group' => 'about', 'label' => 'Our Evolution & Journey', 'sort_order' => 3, 'is_visible' => true, 'payload' => [
                'title' => 'Our Evolution',
                'subtitle' => 'From a local marketing hub to an integrated African digital solutions company with global reach.',
                'milestones' => [
                    [
                        'date' => '19 March 2025',
                        'stage' => 'Foundation',
                        'title' => 'DigiGrowth Hub Founded',
                        'description' => 'The business began on 19th March 2025 as DigiGrowth Hub, dedicated to helping local businesses leverage digital channels.',
                    ],
                    [
                        'date' => 'Mid 2025',
                        'stage' => 'Evolution',
                        'title' => 'Alira Digital & Akéya Digital',
                        'description' => 'Evolved through Alira Digital and Akéya Digital, expanding into multi-platform brand strategy, professional cohort training, and performance media.',
                    ],
                    [
                        'date' => 'September 2025',
                        'stage' => 'Transformation',
                        'title' => 'Adopted the Marqetise Brand',
                        'description' => 'Adopted the Marqetise brand and “Beyond Marketing” tagline, establishing an integrated digital solutions ecosystem combining Digital Growth, Academy, and Cybersecurity.',
                    ],
                    [
                        'date' => 'Long-Term Vision',
                        'stage' => 'Global Ambition',
                        'title' => 'Pan-African & Global Reach',
                        'description' => 'Becoming a trusted African digital solutions company with global reach, recognized for driving business growth, developing talent, and advancing responsible digital practices.',
                    ],
                ],
            ]],
            ['key' => 'about.approach', 'group' => 'about', 'label' => 'Strategic Priorities', 'sort_order' => 4, 'is_visible' => true, 'payload' => [
                'title' => 'Commercial Priorities & Roadmap',
                'items' => [
                    ['title' => 'Digital Growth', 'body' => 'Strengthen Digital Growth, increase recurring client revenue, improve cash collection and establish more predictable operations.'],
                    ['title' => 'The Academy', 'body' => 'Focus on repeatable training delivery, practical curriculum mastery, and reliable enrolment processes.'],
                    ['title' => 'Cybersecurity', 'body' => 'Developed progressively, introducing services only when knowledge, experience, demand and delivery capacity are established.'],
                ],
            ]],
            ['key' => 'courses.hero', 'group' => 'courses', 'label' => 'Courses hero', 'sort_order' => 1, 'is_visible' => true, 'payload' => [
                'headline' => 'Learn digital marketing that you can use',
                'subcopy' => 'Courses for working marketers, operators, and teams. Enrolment is a request to the team, not an online payment.',
            ]],
            ['key' => 'contact.hero', 'group' => 'contact', 'label' => 'Contact hero', 'sort_order' => 1, 'is_visible' => true, 'payload' => [
                'headline' => 'Tell us what you want to grow',
                'subcopy' => 'Send a message about a service, a course, or training for a team. We reply on business days.',
            ]],
        ];

        foreach ($blocks as $block) {
            ContentBlock::query()->updateOrCreate(['key' => $block['key']], $block);
        }
    }

    private function faqs(): void
    {
        $faqs = [
            ['context' => 'contact', 'question' => 'How quickly will you reply?', 'answer' => 'We aim to reply within one business day, Monday to Friday.'],
            ['context' => 'contact', 'question' => 'Do you offer a strategy call?', 'answer' => 'Yes. Use Book a service to request a time. The request is pending until a staff member confirms it.'],
            ['context' => 'contact', 'question' => 'Can I ask about a specific course?', 'answer' => 'Yes. Choose Course enquiry and we will attach the course to your message.'],
            ['context' => 'courses', 'question' => 'How do I enrol?', 'answer' => 'Send a course enquiry from the course page. That request does not take payment or reserve a seat by itself.'],
            ['context' => 'courses', 'question' => 'Do you train teams?', 'answer' => 'Yes. Choose Corporate training on the contact form and tell us about the team.'],
            ['context' => 'courses', 'question' => 'Are certificates included?', 'answer' => 'Each course page states whether a certificate is part of that course.'],
        ];

        foreach ($faqs as $index => $faq) {
            Faq::query()->updateOrCreate(['question' => $faq['question']], [
                ...$faq,
                'sort_order' => $index,
                'is_published' => true,
            ]);
        }
    }

    private function mediaAssets(): void
    {
        $userId = User::query()->value('id');

        $assets = [
            [
                'original_name' => 'Marqetise Logo White Background',
                'path' => 'media/marqetise-logo-white-bg.jpg',
                'mime' => 'image/jpeg',
                'size' => 125000,
                'alt' => 'Marqetise Primary Logo with Antenna Accent',
            ],
            [
                'original_name' => 'Marqetise Logo Sketch & Symbol',
                'path' => 'media/marqetise-logo-sketch.png',
                'mime' => 'image/png',
                'size' => 98000,
                'alt' => 'Marqetise Concept Sketch Mark',
            ],
            [
                'original_name' => 'WAS-US-Jeopardy-YouTube-Edition.jpg',
                'path' => 'https://wearesocial.com/us/wp-content/uploads/sites/3/2026/05/WAS-US-Jeopardy-YouTube-Edition-1024x576.jpg',
                'mime' => 'image/jpeg',
                'size' => 184000,
                'alt' => 'Jeopardy! YouTube Edition Campaign Artwork',
            ],
            [
                'original_name' => 'Tripadvisor-brand-refresh-july-2025.gif',
                'path' => 'https://wearesocial.com/us/wp-content/uploads/sites/3/2025/11/g-91360610-Tripadvisor-brand-refresh-july-2025.gif',
                'mime' => 'image/gif',
                'size' => 450000,
                'alt' => 'Tripadvisor Gen Z Brand Refresh Animation',
            ],
            [
                'original_name' => 'McDonalds-McDonaldland-Campaign.png',
                'path' => 'https://wearesocial.com/us/wp-content/uploads/sites/3/2025/12/Screenshot-2025-12-08-at-6.33.50-PM-1024x364.png',
                'mime' => 'image/png',
                'size' => 312000,
                'alt' => "McDonald's A Trip to McDonaldland Case Study Artwork",
            ],
            [
                'original_name' => 'Adidas-Superbowl-Winning-Throw.png',
                'path' => 'https://wearesocial.com/us/wp-content/uploads/sites/3/2024/08/Adi-Sphere_2-1024x576.png',
                'mime' => 'image/png',
                'size' => 340000,
                'alt' => 'Adidas Super Bowl Winning Throw Campaign',
            ],
            [
                'original_name' => 'Four-Seasons-Fully-Conscious-Baby.png',
                'path' => 'https://wearesocial.com/us/wp-content/uploads/sites/3/2024/10/Four-baby-memes-1024x598.png',
                'mime' => 'image/png',
                'size' => 290000,
                'alt' => 'Four Seasons Fully Conscious Baby Viral TikTok Campaign',
            ],
            [
                'original_name' => 'Gran-Centenario-Tequila.png',
                'path' => 'https://wearesocial.com/us/wp-content/uploads/sites/3/2025/05/Screenshot-2025-05-14-at-2.31.55%E2%80%AFPM-1024x572.png',
                'mime' => 'image/png',
                'size' => 260000,
                'alt' => "Gran Centenario Tequila Don't Be a Gringo Campaign",
            ],
            [
                'original_name' => 'WcDonalds-Anime-Experience.jpg',
                'path' => 'https://wearesocial.com/us/wp-content/uploads/sites/3/2025/04/WcDonalds-1024x726.jpg',
                'mime' => 'image/jpeg',
                'size' => 210000,
                'alt' => "WcDonald's Immersive Anime Dining Experience",
            ],
            [
                'original_name' => 'Global-Digital-Report-2027.jpg',
                'path' => 'https://wearesocial.com/us/wp-content/uploads/sites/3/2026/10/WAS-GLOBAL-REPORT-2027-1024x512.jpg',
                'mime' => 'image/jpeg',
                'size' => 220000,
                'alt' => 'Digital 2027 Global Intelligence Report Cover',
            ],
            [
                'original_name' => 'Think-Forward-2026.jpg',
                'path' => 'https://wearesocial.com/us/wp-content/uploads/sites/3/2026/01/TF_2026_Hero_image-1024x512.jpg',
                'mime' => 'image/jpeg',
                'size' => 195000,
                'alt' => 'Think Forward 2026 Trend Report Artwork',
            ],
            [
                'original_name' => 'Digital-2026-US.png',
                'path' => 'https://wearesocial.com/us/wp-content/uploads/sites/3/2025/11/Digital-2026-1024x578.png',
                'mime' => 'image/png',
                'size' => 175000,
                'alt' => 'Digital 2026 In The U.S. Report Cover',
            ],
            [
                'original_name' => 'Global-Digital-Report-2026.jpg',
                'path' => 'https://wearesocial.com/us/wp-content/uploads/sites/3/2025/10/GDR-2026-1920x1080-1-1024x576.jpg',
                'mime' => 'image/jpeg',
                'size' => 240000,
                'alt' => 'Global Digital Report 2026 Overview',
            ],
            [
                'original_name' => 'Adidas-iPhone-Statement-Showcase.gif',
                'path' => 'https://wearesocial.com/us/wp-content/uploads/sites/3/2025/01/adidas-iphone-1.gif',
                'mime' => 'image/gif',
                'size' => 580000,
                'alt' => 'Marqetise Social Marketing Showcase Demo',
            ],
            [
                'original_name' => 'Marqetise-Agency-Hero-Showreel.mp4',
                'path' => 'https://wearesocial.com/us/wp-content/uploads/sites/3/2026/01/New-2025-EOY-Sizzle.mp4',
                'mime' => 'video/mp4',
                'size' => 12400000,
                'alt' => 'Marqetise Hero Agency Video Showreel',
            ],
        ];

        foreach ($assets as $asset) {
            MediaAsset::query()->updateOrCreate(['path' => $asset['path']], [
                ...$asset,
                'disk' => 'public',
                'uploaded_by' => $userId,
            ]);
        }
    }
}
