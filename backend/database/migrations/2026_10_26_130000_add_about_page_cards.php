<?php

use App\Support\AboutPageCards;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        AboutPageCards::ensure();
    }

    public function down(): void
    {
        // Leave the rows. Deleting them would remove card text an editor saved.
    }
};
