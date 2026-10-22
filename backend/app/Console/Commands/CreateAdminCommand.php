<?php

namespace App\Console\Commands;

use App\Models\Role;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;

class CreateAdminCommand extends Command
{
    protected $signature = 'marqetise:create-admin
        {--name= : Full name}
        {--email= : Email address}
        {--password= : Password, at least 12 characters}';

    protected $description = 'Create the first Super Administrator without a public registration page';

    public function handle(): int
    {
        $this->call('db:seed', ['--class' => RolePermissionSeeder::class, '--force' => true]);

        $name = (string) ($this->option('name') ?: $this->ask('Name'));
        $email = strtolower((string) ($this->option('email') ?: $this->ask('Email')));
        $password = (string) ($this->option('password') ?: $this->secret('Password'));

        $validator = Validator::make(
            ['name' => $name, 'email' => $email, 'password' => $password],
            [
                'name' => ['required', 'string', 'max:120'],
                'email' => ['required', 'email', 'max:255', 'unique:users,email'],
                'password' => ['required', Password::defaults(), function (string $attribute, mixed $value, \Closure $fail): void {
                    $blocked = ['password', 'password123', 'admin', 'administrator', 'secret', 'marqetise', 'changeme'];
                    if (in_array(strtolower((string) $value), $blocked, true)) {
                        $fail('Choose a password that is not a common default.');
                    }
                }],
            ],
        );

        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $error) {
                $this->error($error);
            }

            return self::FAILURE;
        }

        $role = Role::query()->where('slug', 'super-admin')->firstOrFail();

        User::query()->create([
            'name' => $name,
            'email' => $email,
            'password' => $password,
            'status' => 'active',
            'role_id' => $role->id,
            'email_verified_at' => now(),
        ]);

        $this->info('Super Administrator created. There is no default password in the repository.');

        return self::SUCCESS;
    }
}
