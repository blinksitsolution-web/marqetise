<?php

namespace App\Support;

class PublicContentDefaults
{
    /**
     * Chrome and page sections that were still hardcoded. Inserted only when
     * the key is missing so a deploy does not overwrite CMS edits.
     *
     * @return list<array{key: string, group: string, label: string, sort_order: int, is_visible: bool, payload: array<string, mixed>}>
     */
    public static function blocks(): array
    {
        return [
            ['key' => 'site.chrome', 'group' => 'global', 'label' => 'Header and footer', 'sort_order' => 1, 'is_visible' => true, 'payload' => [
                'cta_label' => 'Get In Touch',
                'cta_href' => '/contact',
                'footer_explore_title' => 'Explore',
                'footer_contact_title' => 'Contact',
                'search_placeholder' => 'Search...',
                'banner_image' => '',
                'nav' => [
                    ['label' => 'Home', 'href' => '/'],
                    ['label' => 'About', 'href' => '/about'],
                    ['label' => 'Courses', 'href' => '/courses'],
                    ['label' => 'Services', 'href' => '/services'],
                    ['label' => 'News', 'href' => '/news'],
                    ['label' => 'Contact', 'href' => '/contact'],
                ],
                'footer_links' => [
                    ['label' => 'About', 'href' => '/about'],
                    ['label' => 'Our Team', 'href' => '/team'],
                    ['label' => 'Our Services', 'href' => '/services'],
                    ['label' => 'News & Media', 'href' => '/news'],
                    ['label' => 'Case Studies', 'href' => '/projects'],
                    ['label' => 'Contact', 'href' => '/contact'],
                ],
                'legal_links' => [
                    ['label' => 'Terms of Service', 'href' => '/terms'],
                    ['label' => 'Privacy Policy', 'href' => '/privacy'],
                ],
            ]],
            ['key' => 'services.hero', 'group' => 'services', 'label' => 'Services intro', 'sort_order' => 1, 'is_visible' => true, 'payload' => [
                'title' => '',
                'intro' => '',
            ]],
            ['key' => 'faq.hero', 'group' => 'faq', 'label' => 'FAQ intro', 'sort_order' => 1, 'is_visible' => true, 'payload' => [
                'title' => '',
                'intro' => '',
            ]],
            ['key' => 'contact.form', 'group' => 'contact', 'label' => 'Contact form labels', 'sort_order' => 2, 'is_visible' => true, 'payload' => [
                'name_label' => 'Your Name',
                'email_label' => 'Email Address',
                'subject_label' => 'Subject',
                'message_label' => 'Message (at least 20 characters)',
                'phone_label' => 'Phone (optional)',
                'button_label' => 'Send message',
                'home_name_label' => 'Name',
                'home_email_label' => 'Email',
                'home_subject_label' => 'Subject',
                'home_message_label' => 'Message',
                'home_button_label' => 'Send message',
                'home_consent' => 'We may contact you about this enquiry. This does not take payment or reserve a place.',
            ]],
            ['key' => 'book.hero', 'group' => 'book', 'label' => 'Booking intro', 'sort_order' => 1, 'is_visible' => true, 'payload' => [
                'title' => 'Request a time',
                'eyebrow' => 'consultation',
                'headline' => 'Tell us what you want to cover',
                'subcopy' => 'The request stays pending until a staff member confirms it. Sending this form does not reserve the time.',
            ]],
            ['key' => 'packages.plans', 'group' => 'packages', 'label' => 'Packages', 'sort_order' => 1, 'is_visible' => false, 'payload' => [
                'title' => '',
                'intro' => '',
                'items' => [],
            ]],
        ];
    }

    /**
     * Neutral page records. Inserted only when the slug is missing.
     *
     * @return list<array{title: string, slug: string, excerpt: string, body: string}>
     */
    public static function pages(): array
    {
        return [
            ['title' => 'Services', 'slug' => 'services', 'excerpt' => '', 'body' => ''],
            ['title' => 'FAQ', 'slug' => 'faq', 'excerpt' => '', 'body' => ''],
            ['title' => 'Projects', 'slug' => 'projects', 'excerpt' => '', 'body' => ''],
            ['title' => 'Team', 'slug' => 'team', 'excerpt' => '', 'body' => ''],
            ['title' => 'News', 'slug' => 'news', 'excerpt' => '', 'body' => ''],
            ['title' => 'Testimonials', 'slug' => 'testimonials', 'excerpt' => '', 'body' => ''],
            ['title' => 'Packages', 'slug' => 'packages', 'excerpt' => '', 'body' => ''],
        ];
    }
}
