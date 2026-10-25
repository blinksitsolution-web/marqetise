<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->string('image_path')->nullable()->after('icon');
        });

        Schema::table('courses', function (Blueprint $table) {
            $table->string('image_path')->nullable()->after('instructor_bio');
        });
    }

    public function down(): void
    {
        Schema::table('services', function (Blueprint $table) {
            $table->dropColumn('image_path');
        });

        Schema::table('courses', function (Blueprint $table) {
            $table->dropColumn('image_path');
        });
    }
};
