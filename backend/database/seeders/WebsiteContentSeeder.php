<?php

namespace Database\Seeders;

use App\Models\ContentBlock;
use App\Models\Faq;
use App\Models\Page;
use App\Models\Service;
use Illuminate\Database\Seeder;

class WebsiteContentSeeder extends Seeder
{
    public function run(): void
    {
        $this->pages();
        $this->services();
        $this->blocks();
        $this->faqs();
    }

    private function pages(): void
    {
        $pages = [
            ['title' => 'Home', 'slug' => 'home', 'excerpt' => 'Marketing services and practical training.', 'body' => 'Marqetise helps businesses improve their marketing and helps people build practical digital marketing skills.'],
            ['title' => 'About Us', 'slug' => 'about', 'excerpt' => 'An agency and a training practice.', 'body' => 'Marqetise combines client work with training. The public pages describe the offer; replace any section from the content manager when the final company story is ready.'],
            ['title' => 'Contact', 'slug' => 'contact', 'excerpt' => 'Send an inquiry to the team.', 'body' => 'Use the contact form to request a conversation. Submissions are stored for the team to review.'],
            ['title' => 'Privacy', 'slug' => 'privacy', 'excerpt' => 'How inquiry details are handled.', 'body' => 'Marqetise stores the details you submit so the team can reply. Add the finished privacy policy in this page before launch. Do not send information you are not comfortable storing.'],
            ['title' => 'Terms', 'slug' => 'terms', 'excerpt' => 'Terms of use placeholder.', 'body' => 'Add the finished terms of use in this page before launch. Course enrolment requests are inquiries, not completed payments or confirmed places.'],
        ];

        foreach ($pages as $page) {
            $legal = in_array($page['slug'], ['privacy', 'terms'], true);

            Page::query()->updateOrCreate(['slug' => $page['slug']], [
                ...$page,
                'status' => $legal ? 'draft' : 'published',
                'published_at' => $legal ? null : now(),
                'meta_title' => $page['title'].' · Marqetise',
                'meta_description' => $page['excerpt'],
            ]);
        }
    }

    private function services(): void
    {
        $services = [
            ['name' => 'SEO', 'slug' => 'seo', 'icon' => 'search', 'summary' => 'Search visibility, technical fixes, and content that matches real demand.', 'description' => 'A practical SEO engagement covering site structure, on-page content, and a reporting rhythm you can follow.'],
            ['name' => 'Social Media Marketing', 'slug' => 'social-media-marketing', 'icon' => 'share', 'summary' => 'A clear social presence with a plan for what to publish and why.', 'description' => 'Channel planning, content direction, and a simple way to see what is working.'],
            ['name' => 'Paid Advertising', 'slug' => 'paid-advertising', 'icon' => 'megaphone', 'summary' => 'Campaigns built around a budget, an offer, and a measurable next step.', 'description' => 'Setup and management for paid search or paid social, with spend and results reviewed together.'],
            ['name' => 'Content Marketing', 'slug' => 'content-marketing', 'icon' => 'pen', 'summary' => 'Useful content that supports search, social, and sales conversations.', 'description' => 'Topics, outlines, and a publishing cadence tied to the questions your customers already ask.'],
            ['name' => 'Website Development', 'slug' => 'website-development', 'icon' => 'layout', 'summary' => 'Marketing websites that are clear, fast, and ready to edit.', 'description' => 'Page structure, messaging, and a build that the team can keep up to date.'],
            ['name' => 'Analytics', 'slug' => 'analytics', 'icon' => 'chart', 'summary' => 'Measurement that shows where visits and enquiries come from.', 'description' => 'A focused analytics setup and a readout the team can actually use.'],
        ];

        foreach ($services as $index => $service) {
            Service::query()->updateOrCreate(['slug' => $service['slug']], [
                ...$service,
                'status' => 'published',
                'sort_order' => $index,
                'duration_label' => 'Scoped with you',
            ]);
        }
    }

    private function blocks(): void
    {
        $blocks = [
            ['key' => 'home.hero', 'group' => 'home', 'label' => 'Home hero', 'sort_order' => 1, 'is_visible' => true, 'payload' => [
                'headline' => 'Marketing that grows your business and your skills',
                'subcopy' => 'Marqetise is a digital marketing company and training practice. We plan the work, do the work, and teach the skills behind it.',
                'primary_label' => 'Book a strategy call',
                'primary_href' => '/book',
                'secondary_label' => 'Explore courses',
                'secondary_href' => '/courses',
            ]],
            ['key' => 'home.why', 'group' => 'home', 'label' => 'Why Marqetise', 'sort_order' => 2, 'is_visible' => true, 'payload' => [
                'title' => 'Why businesses choose Marqetise',
                'items' => [
                    ['title' => 'One team for both', 'body' => 'Client work and training sit together, so the people teaching the work also practise it.'],
                    ['title' => 'Clear priorities', 'body' => 'Engagements start with the outcome you need, then the channels that can support it.'],
                    ['title' => 'Work you can review', 'body' => 'You see the plan, the activity, and the questions still open. Nothing is presented as a guaranteed result.'],
                    ['title' => 'Practical training', 'body' => 'Courses are built for marketers and operators who need to use the skill, not only hear about it.'],
                ],
            ]],
            ['key' => 'home.process', 'group' => 'home', 'label' => 'Process', 'sort_order' => 3, 'is_visible' => true, 'payload' => [
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
                'items' => [],
                'note' => 'Add a testimonial only when you have permission to publish it.',
            ]],
            ['key' => 'about.identity', 'group' => 'about', 'label' => 'Mission and vision', 'sort_order' => 1, 'is_visible' => true, 'payload' => [
                'title' => 'An agency and a training practice',
                'body' => 'Marqetise helps businesses with digital marketing and helps people learn the skills to do that work well.',
                'mission' => 'Make useful marketing progress visible to the client we are working with.',
                'vision' => 'Be a trusted partner for marketing delivery and marketing education.',
                'values' => [
                    ['title' => 'Clarity', 'body' => 'Say what the work is, and what it is not.'],
                    ['title' => 'Care', 'body' => 'Treat client and student information as private.'],
                    ['title' => 'Craft', 'body' => 'Prefer finished, usable work over noise.'],
                ],
            ]],
            ['key' => 'about.approach', 'group' => 'about', 'label' => 'Approach', 'sort_order' => 2, 'is_visible' => true, 'payload' => [
                'items' => [
                    ['title' => 'Understand', 'body' => 'Start from the business and the learner, not from a channel.'],
                    ['title' => 'Focus', 'body' => 'Choose a small set of actions that can be finished.'],
                    ['title' => 'Teach', 'body' => 'Explain the work so the team can keep going.'],
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
}
