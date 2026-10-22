<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('description')->nullable();
            $table->boolean('is_system')->default(true);
            $table->timestamps();
        });

        Schema::create('permissions', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('group');
            $table->timestamps();
        });

        Schema::create('permission_role', function (Blueprint $table) {
            $table->foreignId('role_id')->constrained()->cascadeOnDelete();
            $table->foreignId('permission_id')->constrained()->cascadeOnDelete();
            $table->primary(['role_id', 'permission_id']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->string('phone')->nullable()->after('email');
            $table->string('status')->default('active')->index()->after('password');
            $table->foreignId('role_id')->nullable()->after('status')->constrained()->nullOnDelete();
            $table->timestamp('last_login_at')->nullable()->after('role_id');
        });

        Schema::create('pages', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('excerpt')->nullable();
            $table->longText('body')->nullable();
            $table->string('meta_title')->nullable();
            $table->string('meta_description', 320)->nullable();
            $table->string('status')->default('draft')->index();
            $table->timestamp('published_at')->nullable();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('content_blocks', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->string('group')->index();
            $table->string('label');
            $table->json('payload');
            $table->boolean('is_visible')->default(false)->index();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('services', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('summary');
            $table->text('description')->nullable();
            $table->string('icon')->default('spark');
            $table->decimal('starting_price', 10, 2)->nullable();
            $table->string('duration_label')->nullable();
            $table->string('status')->default('draft')->index();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('courses', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->string('summary');
            $table->text('description')->nullable();
            $table->string('category')->index();
            $table->string('level')->index();
            $table->string('format');
            $table->string('duration_label')->nullable();
            $table->decimal('price', 10, 2)->nullable();
            $table->string('price_label')->nullable();
            $table->boolean('certificate_included')->default(false);
            $table->date('next_start_date')->nullable();
            $table->boolean('featured')->default(false)->index();
            $table->string('status')->default('draft')->index();
            $table->json('outcomes')->nullable();
            $table->string('instructor_name')->nullable();
            $table->string('instructor_title')->nullable();
            $table->text('instructor_bio')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('course_modules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->string('title');
            $table->string('summary')->nullable();
            $table->json('lessons')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('faqs', function (Blueprint $table) {
            $table->id();
            $table->string('context')->index();
            $table->string('question');
            $table->text('answer');
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_published')->default(false)->index();
            $table->timestamps();
        });

        Schema::create('inquiries', function (Blueprint $table) {
            $table->id();
            $table->string('type')->index();
            $table->string('name');
            $table->string('email')->index();
            $table->string('phone')->nullable();
            $table->string('subject');
            $table->text('message');
            $table->foreignId('course_id')->nullable()->constrained()->nullOnDelete();
            $table->string('status')->default('new')->index();
            $table->boolean('consent')->default(false);
            $table->string('ip_address', 45)->nullable();
            $table->timestamps();
        });

        Schema::create('inquiry_notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inquiry_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->text('body');
            $table->timestamps();
        });

        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->string('reference')->unique();
            $table->foreignId('service_id')->nullable()->constrained()->nullOnDelete();
            $table->string('service_name');
            $table->string('name');
            $table->string('email')->index();
            $table->string('phone')->nullable();
            $table->string('company')->nullable();
            $table->string('website')->nullable();
            $table->string('budget')->nullable();
            $table->text('goals');
            $table->string('format');
            $table->date('preferred_date')->index();
            $table->string('preferred_time');
            $table->string('status')->default('pending')->index();
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->text('internal_notes')->nullable();
            $table->string('cancellation_reason')->nullable();
            $table->boolean('consent')->default(false);
            $table->timestamps();
        });

        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->index();
            $table->string('phone')->nullable();
            $table->string('status')->default('waitlist')->index();
            $table->foreignId('course_id')->nullable()->constrained()->nullOnDelete();
            $table->date('enrolled_on')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->longText('value')->nullable();
            $table->string('group')->default('general')->index();
            $table->boolean('is_public')->default(false);
            $table->timestamps();
        });

        Schema::create('media', function (Blueprint $table) {
            $table->id();
            $table->string('disk')->default('public');
            $table->string('path');
            $table->string('original_name');
            $table->string('mime');
            $table->unsignedBigInteger('size');
            $table->string('alt')->nullable();
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('action')->index();
            $table->string('auditable_type')->nullable();
            $table->unsignedBigInteger('auditable_id')->nullable();
            $table->json('metadata')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->timestamps();
            $table->index(['auditable_type', 'auditable_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('media');
        Schema::dropIfExists('settings');
        Schema::dropIfExists('students');
        Schema::dropIfExists('bookings');
        Schema::dropIfExists('inquiry_notes');
        Schema::dropIfExists('inquiries');
        Schema::dropIfExists('faqs');
        Schema::dropIfExists('course_modules');
        Schema::dropIfExists('courses');
        Schema::dropIfExists('services');
        Schema::dropIfExists('content_blocks');
        Schema::dropIfExists('pages');

        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('role_id');
            $table->dropColumn(['phone', 'status', 'last_login_at']);
        });

        Schema::dropIfExists('permission_role');
        Schema::dropIfExists('permissions');
        Schema::dropIfExists('roles');
    }
};
