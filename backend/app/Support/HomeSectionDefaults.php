<?php

namespace App\Support;

class HomeSectionDefaults
{
    /**
     * Sections that the static home page can render. Inserted only when the
     * key is missing so a later deploy does not overwrite CMS edits.
     *
     * @return list<array{key: string, group: string, label: string, sort_order: int, is_visible: bool, payload: array<string, mixed>}>
     */
    public static function blocks(): array
    {
        return [
            ['key' => 'home.services', 'group' => 'home', 'label' => 'Services intro', 'sort_order' => 6, 'is_visible' => true, 'payload' => [
                'title' => 'Services',
                'intro' => '',
            ]],
            ['key' => 'home.courses', 'group' => 'home', 'label' => 'Courses intro', 'sort_order' => 7, 'is_visible' => true, 'payload' => [
                'title' => 'Courses',
                'intro' => '',
            ]],
            ['key' => 'home.projects', 'group' => 'home', 'label' => 'Projects', 'sort_order' => 8, 'is_visible' => false, 'payload' => [
                'title' => '',
                'items' => [],
            ]],
            ['key' => 'home.team', 'group' => 'home', 'label' => 'Team', 'sort_order' => 9, 'is_visible' => false, 'payload' => [
                'title' => '',
                'items' => [],
            ]],
            ['key' => 'home.partners', 'group' => 'home', 'label' => 'Partner logos', 'sort_order' => 10, 'is_visible' => false, 'payload' => [
                'title' => '',
                'items' => [],
            ]],
            ['key' => 'home.news', 'group' => 'home', 'label' => 'News', 'sort_order' => 11, 'is_visible' => false, 'payload' => [
                'title' => '',
                'items' => [],
            ]],
            ['key' => 'home.cta', 'group' => 'home', 'label' => 'Closing call to action', 'sort_order' => 12, 'is_visible' => false, 'payload' => [
                'title' => '',
                'body' => '',
                'primary_label' => '',
                'primary_href' => '',
                'secondary_label' => '',
                'secondary_href' => '',
            ]],
        ];
    }
}
