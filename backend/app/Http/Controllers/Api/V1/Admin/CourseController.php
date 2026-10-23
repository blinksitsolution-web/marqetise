<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\SaveCourseRequest;
use App\Http\Resources\CourseResource;
use App\Models\Course;
use App\Services\AuditLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;

class CourseController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Course::query()->with('modules')->withCount('students');

        if ($search = trim((string) $request->query('search', ''))) {
            $like = '%'.addcslashes($search, '%_\\').'%';
            $query->where('title', 'like', $like);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        return CourseResource::collection(
            $query->orderBy('sort_order')->latest()->paginate(min(max($request->integer('per_page', 12), 1), 100))
        );
    }

    public function store(SaveCourseRequest $request, AuditLogger $audit): JsonResponse
    {
        $course = $this->persist(new Course, $request);
        $audit->log('course.created', $course, ['status' => $course->status]);

        return (new CourseResource($course))->response()->setStatusCode(201);
    }

    public function show(Course $course): CourseResource
    {
        return new CourseResource($course->load('modules')->loadCount('students'));
    }

    public function update(SaveCourseRequest $request, Course $course, AuditLogger $audit): CourseResource
    {
        $course = $this->persist($course, $request);
        $audit->log('course.updated', $course, ['status' => $course->status]);

        return new CourseResource($course);
    }

    public function destroy(Course $course, AuditLogger $audit): Response
    {
        $audit->log('course.deleted', $course, ['slug' => $course->slug]);
        $course->delete();

        return response()->noContent();
    }

    private function persist(Course $course, SaveCourseRequest $request): Course
    {
        return DB::transaction(function () use ($course, $request) {
            $data = $request->safe()->except(['modules']);
            $course->fill($data)->save();
            $course->modules()->delete();

            foreach (array_values($request->input('modules', [])) as $index => $module) {
                $course->modules()->create([
                    'title' => $module['title'],
                    'summary' => $module['summary'] ?? null,
                    'lessons' => array_values($module['lessons'] ?? []),
                    'sort_order' => $index,
                ]);
            }

            return $course->load('modules')->loadCount('students');
        });
    }
}
