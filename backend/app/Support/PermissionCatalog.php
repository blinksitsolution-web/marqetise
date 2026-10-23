<?php

namespace App\Support;

class PermissionCatalog
{
    /**
     * @return array<string, array{name: string, group: string}>
     */
    public static function permissions(): array
    {
        return [
            'dashboard.view' => ['name' => 'View dashboard', 'group' => 'Dashboard'],
            'content.view' => ['name' => 'View website content', 'group' => 'Content'],
            'content.manage' => ['name' => 'Manage website content', 'group' => 'Content'],
            'courses.view' => ['name' => 'View courses', 'group' => 'Courses'],
            'courses.manage' => ['name' => 'Manage courses', 'group' => 'Courses'],
            'inquiries.view' => ['name' => 'View inquiries', 'group' => 'Inquiries'],
            'inquiries.manage' => ['name' => 'Manage inquiries', 'group' => 'Inquiries'],
            'bookings.view' => ['name' => 'View bookings', 'group' => 'Bookings'],
            'bookings.manage' => ['name' => 'Manage bookings', 'group' => 'Bookings'],
            'students.view' => ['name' => 'View students', 'group' => 'Students'],
            'students.manage' => ['name' => 'Manage students', 'group' => 'Students'],
            'users.view' => ['name' => 'View users', 'group' => 'Users'],
            'users.manage' => ['name' => 'Manage users', 'group' => 'Users'],
            'roles.view' => ['name' => 'View roles', 'group' => 'Access'],
            'roles.manage' => ['name' => 'Manage roles', 'group' => 'Access'],
            'settings.view' => ['name' => 'View settings', 'group' => 'Settings'],
            'settings.manage' => ['name' => 'Manage settings', 'group' => 'Settings'],
            'media.manage' => ['name' => 'Upload media', 'group' => 'Content'],
            'audit.view' => ['name' => 'View activity log', 'group' => 'Dashboard'],
        ];
    }

    /**
     * @return array<string, array{name: string, description: string, permissions: array<int, string>|string}>
     */
    public static function roles(): array
    {
        $assignedSeparately = ['students.view', 'bookings.view'];

        $viewOnly = array_values(array_filter(
            array_keys(self::permissions()),
            fn (string $slug) => str_ends_with($slug, '.view') && ! in_array($slug, $assignedSeparately, true),
        ));

        return [
            'super-admin' => [
                'name' => 'Super Administrator',
                'description' => 'Full access, including roles and the last-administrator safeguard.',
                'permissions' => '*',
            ],
            'administrator' => [
                'name' => 'Administrator',
                'description' => 'Operates the business, without changing the permission model.',
                'permissions' => array_values(array_filter(
                    array_keys(self::permissions()),
                    fn (string $slug) => $slug !== 'roles.manage',
                )),
            ],
            'content-editor' => [
                'name' => 'Content Editor',
                'description' => 'Publishes pages, services, and courses. Cannot manage people or settings.',
                'permissions' => [
                    'dashboard.view', 'content.view', 'content.manage',
                    'courses.view', 'courses.manage', 'media.manage',
                ],
            ],
            'marketing-staff' => [
                'name' => 'Marketing Staff',
                'description' => 'Handles inquiries and service bookings.',
                'permissions' => [
                    'dashboard.view', 'content.view', 'courses.view',
                    'inquiries.view', 'inquiries.manage',
                    'bookings.view', 'bookings.manage',
                ],
            ],
            'instructor' => [
                'name' => 'Instructor',
                'description' => 'Maintains course material. Student and booking access is assigned separately.',
                'permissions' => [
                    'dashboard.view', 'courses.view', 'courses.manage',
                ],
            ],
            'student-support' => [
                'name' => 'Student Support',
                'description' => 'Supports learners and follows up on inquiries and bookings.',
                'permissions' => [
                    'dashboard.view', 'students.view', 'students.manage',
                    'inquiries.view', 'inquiries.manage',
                    'bookings.view', 'bookings.manage', 'courses.view',
                ],
            ],
            'read-only' => [
                'name' => 'Read-Only Staff',
                'description' => 'Can review records that have been granted. Students and bookings stay closed until those permissions are assigned.',
                'permissions' => $viewOnly,
            ],
        ];
    }
}
