<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $roleIds = DB::table('roles')->whereIn('slug', ['instructor', 'read-only'])->pluck('id');
        $permissionIds = DB::table('permissions')->whereIn('slug', ['students.view', 'bookings.view'])->pluck('id');

        if ($roleIds->isNotEmpty() && $permissionIds->isNotEmpty()) {
            DB::table('permission_role')
                ->whereIn('role_id', $roleIds)
                ->whereIn('permission_id', $permissionIds)
                ->delete();
        }

        DB::table('roles')->where('slug', 'instructor')->update([
            'description' => 'Maintains course material. Student and booking access is assigned separately.',
        ]);

        DB::table('roles')->where('slug', 'read-only')->update([
            'description' => 'Can review records that have been granted. Students and bookings stay closed until those permissions are assigned.',
        ]);
    }

    public function down(): void
    {
        $instructor = DB::table('roles')->where('slug', 'instructor')->value('id');
        $reader = DB::table('roles')->where('slug', 'read-only')->value('id');
        $students = DB::table('permissions')->where('slug', 'students.view')->value('id');
        $bookings = DB::table('permissions')->where('slug', 'bookings.view')->value('id');

        $rows = [];

        if ($instructor && $students) {
            $rows[] = ['role_id' => $instructor, 'permission_id' => $students];
        }

        if ($reader && $students) {
            $rows[] = ['role_id' => $reader, 'permission_id' => $students];
        }

        if ($reader && $bookings) {
            $rows[] = ['role_id' => $reader, 'permission_id' => $bookings];
        }

        foreach ($rows as $row) {
            $exists = DB::table('permission_role')
                ->where('role_id', $row['role_id'])
                ->where('permission_id', $row['permission_id'])
                ->exists();

            if (! $exists) {
                DB::table('permission_role')->insert($row);
            }
        }
    }
};
