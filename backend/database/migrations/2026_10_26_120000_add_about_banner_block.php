<?php

use App\Support\AboutBannerBlock;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        AboutBannerBlock::ensure();
    }

    public function down(): void
    {
        // Leave the row. Removing it would delete a banner line an editor saved.
    }
};
