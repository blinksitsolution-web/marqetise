<?php

namespace App\Console\Commands;

use App\Models\AuditLog;
use App\Models\Inquiry;
use App\Models\Setting;
use Illuminate\Console\Command;

class ForgetIpAddresses extends Command
{
    protected $signature = 'marqetise:forget-ip-addresses';

    protected $description = 'Clear inquiry and audit IP addresses older than the retention setting';

    public function handle(): int
    {
        $days = Setting::getValue('ip_retention_days');

        if (! is_numeric($days) || (int) $days < 1) {
            $this->comment('IP retention days are not set. No addresses were cleared.');

            return self::SUCCESS;
        }

        $cutoff = now()->subDays((int) $days);
        $inquiries = Inquiry::query()
            ->whereNotNull('ip_address')
            ->where('created_at', '<', $cutoff)
            ->update(['ip_address' => null]);
        $audits = AuditLog::query()
            ->whereNotNull('ip_address')
            ->where('created_at', '<', $cutoff)
            ->update(['ip_address' => null]);

        $this->info("Cleared {$inquiries} inquiry addresses and {$audits} audit addresses older than {$days} days.");

        return self::SUCCESS;
    }
}
