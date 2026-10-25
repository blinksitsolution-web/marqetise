<?php

use App\Http\Controllers\Api\V1\AccountController;
use App\Http\Controllers\Api\V1\Admin\BookingController;
use App\Http\Controllers\Api\V1\Admin\ContentBlockController;
use App\Http\Controllers\Api\V1\Admin\CourseController as AdminCourseController;
use App\Http\Controllers\Api\V1\Admin\DashboardController;
use App\Http\Controllers\Api\V1\Admin\FaqController;
use App\Http\Controllers\Api\V1\Admin\InquiryController;
use App\Http\Controllers\Api\V1\Admin\MediaController;
use App\Http\Controllers\Api\V1\Admin\PageController;
use App\Http\Controllers\Api\V1\Admin\RoleController;
use App\Http\Controllers\Api\V1\Admin\SearchController;
use App\Http\Controllers\Api\V1\Admin\ServiceController as AdminServiceController;
use App\Http\Controllers\Api\V1\Admin\SettingController;
use App\Http\Controllers\Api\V1\Admin\StudentController;
use App\Http\Controllers\Api\V1\Admin\UserController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\PublicBookingController;
use App\Http\Controllers\Api\V1\PublicCatalogController;
use App\Http\Controllers\Api\V1\PublicInquiryController;
use App\Http\Controllers\Api\V1\PublicSiteController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::get('site', [PublicSiteController::class, 'show']);
    Route::get('courses', [PublicCatalogController::class, 'courses']);
    Route::get('courses/{slug}', [PublicCatalogController::class, 'course']);
    Route::get('services', [PublicCatalogController::class, 'services']);
    Route::get('services/{slug}', [PublicCatalogController::class, 'service']);
    Route::get('pages/{slug}', [PublicCatalogController::class, 'page']);
    Route::post('inquiries', [PublicInquiryController::class, 'store'])->middleware('throttle:inquiries');
    Route::post('bookings', [PublicBookingController::class, 'store'])->middleware('throttle:inquiries');

    Route::post('auth/login', [AuthController::class, 'login'])->middleware('throttle:login');
    Route::post('auth/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:login');
    Route::post('auth/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:login');

    Route::middleware(['auth:sanctum', 'active'])->group(function () {
        Route::post('auth/logout', [AuthController::class, 'logout']);
        Route::get('auth/user', [AuthController::class, 'user']);
        Route::patch('account', [AccountController::class, 'update']);
        Route::get('admin/search', SearchController::class);

        Route::middleware('permission:dashboard.view')->get('admin/dashboard', DashboardController::class);

        Route::middleware('permission:content.view')->group(function () {
            Route::get('admin/pages', [PageController::class, 'index']);
            Route::get('admin/pages/{page}', [PageController::class, 'show']);
            Route::get('admin/blocks', [ContentBlockController::class, 'index']);
            Route::get('admin/faqs', [FaqController::class, 'index']);
            Route::get('admin/services', [AdminServiceController::class, 'index']);
        });

        Route::middleware('permission:content.manage')->group(function () {
            Route::post('admin/pages', [PageController::class, 'store']);
            Route::put('admin/pages/{page}', [PageController::class, 'update']);
            Route::delete('admin/pages/{page}', [PageController::class, 'destroy']);
            Route::post('admin/blocks', [ContentBlockController::class, 'store']);
            Route::put('admin/blocks/{block}', [ContentBlockController::class, 'update']);
            Route::delete('admin/blocks/{block}', [ContentBlockController::class, 'destroy']);
            Route::post('admin/faqs', [FaqController::class, 'store']);
            Route::put('admin/faqs/{faq}', [FaqController::class, 'update']);
            Route::delete('admin/faqs/{faq}', [FaqController::class, 'destroy']);
            Route::post('admin/services', [AdminServiceController::class, 'store']);
            Route::put('admin/services/{service}', [AdminServiceController::class, 'update']);
            Route::delete('admin/services/{service}', [AdminServiceController::class, 'destroy']);
        });

        Route::middleware('permission:courses.view')->group(function () {
            Route::get('admin/courses', [AdminCourseController::class, 'index']);
            Route::get('admin/courses/{course}', [AdminCourseController::class, 'show']);
        });

        Route::middleware('permission:courses.manage')->group(function () {
            Route::post('admin/courses', [AdminCourseController::class, 'store']);
            Route::put('admin/courses/{course}', [AdminCourseController::class, 'update']);
            Route::delete('admin/courses/{course}', [AdminCourseController::class, 'destroy']);
        });

        Route::middleware('permission:inquiries.view')->group(function () {
            Route::get('admin/inquiries', [InquiryController::class, 'index']);
            Route::get('admin/inquiries/{inquiry}', [InquiryController::class, 'show']);
        });

        Route::middleware('permission:inquiries.manage')->group(function () {
            Route::patch('admin/inquiries/{inquiry}', [InquiryController::class, 'update']);
            Route::post('admin/inquiries/{inquiry}/notes', [InquiryController::class, 'note']);
            Route::post('admin/inquiries/{inquiry}/student', [InquiryController::class, 'createStudent']);
        });

        Route::middleware('permission:bookings.view')->group(function () {
            Route::get('admin/bookings', [BookingController::class, 'index']);
            Route::get('admin/bookings/{booking}', [BookingController::class, 'show']);
        });
        Route::patch('admin/bookings/{booking}', [BookingController::class, 'update'])->middleware('permission:bookings.manage');

        Route::middleware('permission:students.view')->group(function () {
            Route::get('admin/students', [StudentController::class, 'index']);
            Route::get('admin/students/{student}', [StudentController::class, 'show']);
        });

        Route::middleware('permission:students.manage')->group(function () {
            Route::post('admin/students', [StudentController::class, 'store']);
            Route::put('admin/students/{student}', [StudentController::class, 'update']);
            Route::delete('admin/students/{student}', [StudentController::class, 'destroy']);
        });

        Route::middleware('permission:users.view')->group(function () {
            Route::get('admin/users', [UserController::class, 'index']);
            Route::get('admin/users/{user}', [UserController::class, 'show']);
        });

        Route::middleware('permission:users.manage')->group(function () {
            Route::post('admin/users', [UserController::class, 'store']);
            Route::post('admin/users/{user}/invite', [UserController::class, 'invite']);
            Route::put('admin/users/{user}', [UserController::class, 'update']);
            Route::delete('admin/users/{user}', [UserController::class, 'destroy']);
        });

        Route::middleware('permission:roles.view')->get('admin/roles', [RoleController::class, 'index']);
        Route::middleware('permission:roles.manage')->group(function () {
            Route::post('admin/roles', [RoleController::class, 'store']);
            Route::put('admin/roles/{role}', [RoleController::class, 'update']);
        });

        Route::middleware('permission:settings.view')->get('admin/settings', [SettingController::class, 'index']);
        Route::middleware('permission:settings.manage')->put('admin/settings', [SettingController::class, 'update']);
        Route::middleware('permission:media.manage')->post('admin/media', [MediaController::class, 'store']);
    });
});
