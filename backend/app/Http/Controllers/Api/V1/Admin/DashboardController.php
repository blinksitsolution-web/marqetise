<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Booking;
use App\Models\Course;
use App\Models\Inquiry;
use App\Models\Student;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $user = request()->user();
        $start = now()->startOfMonth()->subMonths(11);
        $studentRows = Student::query()->where('created_at', '>=', $start)->get(['created_at']);
        $byMonth = $studentRows->groupBy(fn (Student $student) => $student->created_at->format('Y-m'))->map->count();

        $trend = collect(range(0, 11))->map(function (int $offset) use ($start, $byMonth) {
            $month = $start->copy()->addMonths($offset);
            $key = $month->format('Y-m');

            return [
                'month' => $key,
                'label' => $month->format('M'),
                'students' => (int) ($byMonth[$key] ?? 0),
            ];
        })->values();

        return response()->json([
            'data' => [
                'counts' => [
                    'students' => Student::query()->count(),
                    'active_students' => Student::query()->where('status', 'active')->count(),
                    'published_courses' => Course::query()->where('status', 'published')->count(),
                    'users' => User::query()->count(),
                    'new_inquiries' => Inquiry::query()->where('status', 'new')->count(),
                    'pending_bookings' => Booking::query()->where('status', 'pending')->count(),
                ],
                'inquiry_trend' => [
                    'last_30_days' => Inquiry::query()->where('created_at', '>=', now()->subDays(30))->count(),
                    'previous_30_days' => Inquiry::query()
                        ->whereBetween('created_at', [now()->subDays(60), now()->subDays(30)])
                        ->count(),
                ],
                'enrolment_trend' => $trend,
                'course_enrolments' => Course::query()
                    ->withCount('students')
                    ->orderByDesc('students_count')
                    ->limit(6)
                    ->get(['id', 'title', 'status'])
                    ->map(fn (Course $course) => [
                        'id' => $course->id,
                        'title' => $course->title,
                        'status' => $course->status,
                        'students' => $course->students_count,
                    ]),
                'recent_students' => $user->hasPermission('students.view')
                    ? Student::query()->with('course:id,title')->latest()->limit(5)->get()
                        ->map(fn (Student $student) => [
                            'id' => $student->id,
                            'name' => $student->name,
                            'course' => $student->course?->title,
                            'status' => $student->status,
                            'created_at' => $student->created_at,
                        ])
                    : [],
                'recent_inquiries' => $user->hasPermission('inquiries.view')
                    ? Inquiry::query()->latest()->limit(5)->get(['id', 'name', 'subject', 'type', 'status', 'created_at'])
                    : [],
                'upcoming_bookings' => $user->hasPermission('bookings.view')
                    ? Booking::query()
                        ->whereDate('preferred_date', '>=', today())
                        ->whereIn('status', ['pending', 'confirmed'])
                        ->orderBy('preferred_date')
                        ->limit(5)
                        ->get(['id', 'reference', 'name', 'service_name', 'preferred_date', 'preferred_time', 'status'])
                    : [],
                'activity' => $user->hasPermission('audit.view')
                    ? AuditLog::query()->with('user:id,name')->latest()->limit(8)->get()
                        ->map(fn (AuditLog $log) => [
                            'id' => $log->id,
                            'action' => $log->action,
                            'actor' => $log->user?->name,
                            'created_at' => $log->created_at,
                        ])
                    : [],
            ],
        ]);
    }
}
