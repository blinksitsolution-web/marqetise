<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->string('slot_key')->nullable()->unique();
        });

        $duplicates = DB::table('bookings')
            ->select('preferred_date', 'preferred_time')
            ->whereIn('status', ['pending', 'confirmed'])
            ->groupBy('preferred_date', 'preferred_time')
            ->havingRaw('count(*) > 1')
            ->get();

        if ($duplicates->isNotEmpty()) {
            throw new \RuntimeException('Cannot add booking slot uniqueness: duplicate pending or confirmed slots exist. Resolve them before migrating.');
        }

        DB::table('bookings')
            ->whereIn('status', ['pending', 'confirmed'])
            ->orderBy('id')
            ->lazy()
            ->each(function (object $row): void {
                $date = substr((string) $row->preferred_date, 0, 10);
                $time = substr((string) $row->preferred_time, 0, 5);

                DB::table('bookings')->where('id', $row->id)->update([
                    'slot_key' => $date.'|'.$time,
                ]);
            });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropUnique(['slot_key']);
            $table->dropColumn('slot_key');
        });
    }
};
