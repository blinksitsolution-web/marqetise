<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->boolean('image_removed')->default(false);
        });

        Schema::table('courses', function (Blueprint $table) {
            $table->boolean('image_removed')->default(false);
        });
    }

    public function down(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->dropColumn('image_removed');
        });

        Schema::table('courses', function (Blueprint $table) {
            $table->dropColumn('image_removed');
        });
    }
};
