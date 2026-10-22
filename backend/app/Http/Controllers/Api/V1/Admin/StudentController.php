<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\SaveStudentRequest;
use App\Http\Resources\StudentResource;
use App\Models\Student;
use App\Services\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class StudentController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Student::query()->with('course:id,title,slug');

        if ($search = trim((string) $request->query('search', ''))) {
            $like = '%'.addcslashes($search, '%_\\').'%';
            $query->where(function ($inner) use ($like) {
                $inner->where('name', 'like', $like)->orWhere('email', 'like', $like);
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        return StudentResource::collection($query->latest()->paginate(15));
    }

    public function store(SaveStudentRequest $request, AuditLogger $audit): StudentResource
    {
        $student = Student::query()->create($request->validated());
        $audit->log('student.created', $student);

        return new StudentResource($student->load('course'));
    }

    public function show(Student $student): StudentResource
    {
        return new StudentResource($student->load('course'));
    }

    public function update(SaveStudentRequest $request, Student $student, AuditLogger $audit): StudentResource
    {
        $student->update($request->validated());
        $audit->log('student.updated', $student, ['status' => $student->status]);

        return new StudentResource($student->load('course'));
    }

    public function destroy(Student $student, AuditLogger $audit): Response
    {
        $audit->log('student.deleted', $student);
        $student->delete();

        return response()->noContent();
    }
}
