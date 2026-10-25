<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Symfony\Component\Process\Process;

class BackupDatabase extends Command
{
    protected $signature = 'marqetise:backup';

    protected $description = 'Copy the database into storage/app/backups when BACKUP_ENABLED is true';

    public function handle(): int
    {
        if (! config('marqetise.backup_enabled')) {
            $this->comment('BACKUP_ENABLED is off. No backup was written.');

            return self::SUCCESS;
        }

        $directory = storage_path('app/backups');
        if (! is_dir($directory) && ! mkdir($directory, 0700, true) && ! is_dir($directory)) {
            $this->error('The backup directory could not be created.');

            return self::FAILURE;
        }

        $driver = (string) config('database.default');
        $connection = config("database.connections.{$driver}");
        if (! is_array($connection)) {
            $this->error('The database connection is not configured.');

            return self::FAILURE;
        }

        $stamp = now()->format('Ymd-His');

        return match ($connection['driver'] ?? '') {
            'sqlite' => $this->copySqlite($connection, $directory.'/marqetise-'.$stamp.'.sqlite'),
            'mysql' => $this->dumpMysql($connection, $directory.'/marqetise-'.$stamp.'.sql'),
            default => $this->unsupported(),
        };
    }

    /**
     * @param  array<string, mixed>  $connection
     */
    private function copySqlite(array $connection, string $target): int
    {
        $source = $connection['database'] ?? null;
        if (! is_string($source) || $source === ':memory:' || ! is_file($source)) {
            $this->error('The sqlite database file is not available to copy.');

            return self::FAILURE;
        }

        if (! copy($source, $target)) {
            $this->error('The sqlite database was not copied.');

            return self::FAILURE;
        }

        $this->info($target);

        return self::SUCCESS;
    }

    /**
     * @param  array<string, mixed>  $connection
     */
    private function dumpMysql(array $connection, string $target): int
    {
        $user = (string) ($connection['username'] ?? '');
        $password = (string) ($connection['password'] ?? '');
        $database = (string) ($connection['database'] ?? '');

        if ($user === '' || $password === '' || $database === '') {
            $this->error('MySQL backup needs a user, a password, and a database name.');

            return self::FAILURE;
        }

        if (preg_match("/[\r\n\"]/", $user.$password.$database) === 1) {
            $this->error('The database credentials contain a character this backup file cannot store.');

            return self::FAILURE;
        }

        $defaults = tempnam(sys_get_temp_dir(), 'mq-backup');
        if ($defaults === false) {
            $this->error('A temporary defaults file could not be created.');

            return self::FAILURE;
        }

        chmod($defaults, 0600);
        file_put_contents($defaults, implode("\n", [
            '[client]',
            'user='.$user,
            'password='.$password,
            'host='.(string) ($connection['host'] ?? '127.0.0.1'),
            'port='.(string) ($connection['port'] ?? '3306'),
            '',
        ]));

        try {
            $process = new Process([
                'mysqldump',
                '--defaults-extra-file='.$defaults,
                '--single-transaction',
                '--no-tablespaces',
                $database,
            ]);
            $process->setTimeout(120);
            $process->run();

            if (! $process->isSuccessful()) {
                $this->error('mysqldump did not finish. No backup was written.');

                return self::FAILURE;
            }

            if (file_put_contents($target, $process->getOutput()) === false) {
                $this->error('The backup file could not be written.');

                return self::FAILURE;
            }
        } finally {
            @unlink($defaults);
        }

        $this->info($target);

        return self::SUCCESS;
    }

    private function unsupported(): int
    {
        $this->error('This database driver has no backup path.');

        return self::FAILURE;
    }
}
