<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use App\Support\PermissionCatalog;
use Illuminate\Database\Seeder;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        foreach (PermissionCatalog::permissions() as $slug => $permission) {
            Permission::query()->updateOrCreate(['slug' => $slug], [
                'name' => $permission['name'],
                'group' => $permission['group'],
            ]);
        }

        $all = Permission::query()->pluck('id', 'slug');

        foreach (PermissionCatalog::roles() as $slug => $role) {
            $record = Role::query()->updateOrCreate(['slug' => $slug], [
                'name' => $role['name'],
                'description' => $role['description'],
                'is_system' => true,
            ]);

            $slugs = $role['permissions'] === '*' ? $all->keys() : collect($role['permissions']);
            $record->permissions()->sync($all->only($slugs->all())->values());
        }
    }
}
