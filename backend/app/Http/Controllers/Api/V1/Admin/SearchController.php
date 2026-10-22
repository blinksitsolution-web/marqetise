<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Course;
use App\Models\Inquiry;
use App\Models\Page;
use App\Models\Student;
use App\Support\SafeText;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $term = SafeText::clean((string) $request->query('q', '')) ?? '';

        if (mb_strlen($term) < 2) {
            return response()->json(['data' => []]);
        }

        $like = '%'.addcslashes($term, '%_\\').'%';
        $user = $request->user();
        $data = [];

        if ($user->hasPermission('students.view')) {
            $data['students'] = Student::query()->where('name', 'like', $like)->orWhere('email', 'like', $like)->limit(5)->get(['id', 'name', 'email']);
        }

        if ($user->hasPermission('courses.view')) {
            $data['courses'] = Course::query()->where('title', 'like', $like)->limit(5)->get(['id', 'title', 'slug', 'status']);
        }

        if ($user->hasPermission('content.view')) {
            $data['pages'] = Page::query()->where('title', 'like', $like)->limit(5)->get(['id', 'title', 'slug', 'status']);
        }

        if ($user->hasPermission('inquiries.view')) {
            $data['inquiries'] = Inquiry::query()->where('name', 'like', $like)->orWhere('subject', 'like', $like)->limit(5)->get(['id', 'name', 'subject', 'status']);
        }

        if ($user->hasPermission('bookings.view')) {
            $data['bookings'] = Booking::query()->where('reference', 'like', $like)->orWhere('name', 'like', $like)->limit(5)->get(['id', 'reference', 'name', 'status']);
        }

        return response()->json(['data' => $data]);
    }
}
