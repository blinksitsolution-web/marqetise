<?php

namespace App\Support;

use App\Models\ContentBlock;
use App\Models\Page;

class AboutPageCards
{
    /**
     * Copy the About page body into card blocks once. An existing row is left
     * as saved, and the page body itself is never rewritten.
     */
    public static function ensure(): void
    {
        $body = (string) Page::query()->where('slug', 'about')->value('body');
        $parsed = self::fromBody($body);

        foreach (self::definitions() as $key => $definition) {
            if (ContentBlock::query()->where('key', $key)->exists()) {
                continue;
            }

            ContentBlock::query()->create([
                'key' => $key,
                'group' => 'about',
                'label' => $definition['label'],
                'payload' => $parsed[$key] ?? self::blank(),
                'is_visible' => true,
                'sort_order' => $definition['sort_order'],
            ]);
        }
    }

    /**
     * @return array<string, array{title: string, body: string, image: string, image_alt: string, items: list<array{title: string, body: string, image?: string, image_alt?: string}>}>
     */
    public static function fromBody(string $body): array
    {
        $grouped = [
            'who' => [],
            'story' => [],
            'priorities' => [],
            'direction' => [],
            'values' => [],
            'extra' => [],
        ];

        foreach (self::sections($body) as $section) {
            $grouped[self::bucket($section['title'])][] = $section;
        }

        $cards = [];
        foreach (self::definitions() as $key => $definition) {
            $name = $definition['bucket'];
            $cards[$key] = $name === 'direction'
                ? self::directionPayload($grouped['direction'])
                : ($name === 'extra'
                    ? self::extraPayload($grouped['extra'])
                    : self::singlePayload($grouped[$name][0] ?? null));
        }

        return $cards;
    }

    /**
     * @return array<string, array{label: string, sort_order: int, bucket: string, items: bool}>
     */
    public static function definitions(): array
    {
        return [
            'about.who' => ['label' => 'Who we are card', 'sort_order' => 20, 'bucket' => 'who', 'items' => true],
            'about.story' => ['label' => 'Our story', 'sort_order' => 21, 'bucket' => 'story', 'items' => false],
            'about.priorities' => ['label' => 'Our priorities', 'sort_order' => 22, 'bucket' => 'priorities', 'items' => false],
            'about.direction' => ['label' => 'Ambition, vision, mission', 'sort_order' => 23, 'bucket' => 'direction', 'items' => true],
            'about.values' => ['label' => 'Core values', 'sort_order' => 24, 'bucket' => 'values', 'items' => true],
            'about.extra' => ['label' => 'Other sections', 'sort_order' => 25, 'bucket' => 'extra', 'items' => true],
        ];
    }

    /**
     * @return list<array{title: string, body: string}>
     */
    private static function sections(string $body): array
    {
        $body = str_replace("\r\n", "\n", trim($body));
        if ($body === '') {
            return [];
        }

        if (! str_starts_with($body, '# ')) {
            return [['title' => 'Who we are', 'body' => $body]];
        }

        $sections = [];
        foreach (preg_split('/^# /m', $body) ?: [] as $part) {
            $part = trim($part);
            if ($part === '') {
                continue;
            }
            [$title, $rest] = array_pad(explode("\n", $part, 2), 2, '');
            $sections[] = ['title' => trim($title), 'body' => trim($rest)];
        }

        return $sections;
    }

    private static function bucket(string $title): string
    {
        $name = strtolower($title);
        if (str_contains($name, 'who we are')) {
            return 'who';
        }
        if (str_contains($name, 'story')) {
            return 'story';
        }
        if (str_contains($name, 'priorit')) {
            return 'priorities';
        }
        if (str_contains($name, 'value')) {
            return 'values';
        }
        if (preg_match('/ambition|vision|mission|brand position/', $name) === 1) {
            return 'direction';
        }

        return 'extra';
    }

    /**
     * @param  array{title: string, body: string}|null  $section
     * @return array{title: string, body: string, image: string, image_alt: string, items: list<array{title: string, body: string}>}
     */
    private static function singlePayload(?array $section): array
    {
        if ($section === null) {
            return self::blank();
        }

        $parts = self::subsections($section['body']);

        return [
            'title' => $section['title'],
            'body' => $parts['intro'],
            'image' => '',
            'image_alt' => '',
            'items' => $parts['items'],
        ];
    }

    /**
     * @param  list<array{title: string, body: string}>  $sections
     * @return array{title: string, body: string, image: string, image_alt: string, items: list<array{title: string, body: string}>}
     */
    private static function directionPayload(array $sections): array
    {
        if ($sections === []) {
            return self::blank();
        }

        $first = array_shift($sections);
        $items = [];
        foreach ($sections as $section) {
            $items[] = ['title' => $section['title'], 'body' => $section['body']];
        }

        return [
            'title' => $first['title'],
            'body' => $first['body'],
            'image' => '',
            'image_alt' => '',
            'items' => $items,
        ];
    }

    /**
     * @param  list<array{title: string, body: string}>  $sections
     * @return array{title: string, body: string, image: string, image_alt: string, items: list<array{title: string, body: string, image: string, image_alt: string}>}
     */
    private static function extraPayload(array $sections): array
    {
        return [
            'title' => '',
            'body' => '',
            'image' => '',
            'image_alt' => '',
            'items' => array_map(fn (array $section) => [
                'title' => $section['title'],
                'body' => $section['body'],
                'image' => '',
                'image_alt' => '',
            ], $sections),
        ];
    }

    /**
     * @return array{intro: string, items: list<array{title: string, body: string}>}
     */
    private static function subsections(string $body): array
    {
        if (! str_contains("\n".$body, "\n## ")) {
            return ['intro' => $body, 'items' => []];
        }

        $chunks = preg_split('/^## /m', $body) ?: [];
        $intro = trim((string) array_shift($chunks));
        $items = [];
        foreach ($chunks as $chunk) {
            $chunk = trim($chunk);
            if ($chunk === '') {
                continue;
            }
            [$title, $rest] = array_pad(explode("\n", $chunk, 2), 2, '');
            $items[] = ['title' => trim($title), 'body' => trim($rest)];
        }

        return ['intro' => $intro, 'items' => $items];
    }

    /**
     * @return array{title: string, body: string, image: string, image_alt: string, items: list<empty>}
     */
    private static function blank(): array
    {
        return [
            'title' => '',
            'body' => '',
            'image' => '',
            'image_alt' => '',
            'items' => [],
        ];
    }
}
