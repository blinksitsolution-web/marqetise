<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreInquiryNoteRequest;
use App\Http\Requests\UpdateInquiryRequest;
use App\Http\Resources\InquiryResource;
use App\Http\Resources\StudentResource;
use App\Models\Inquiry;
use App\Models\Student;
use App\Services\AuditLogger;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class InquiryController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Inquiry::query()->with('course:id,title,slug');

        if ($search = trim((string) $request->query('search', ''))) {
            $like = '%'.addcslashes($search, '%_\\').'%';
            $query->where(function ($inner) use ($like) {
                $inner->where('name', 'like', $like)
                    ->orWhere('email', 'like', $like)
                    ->orWhere('subject', 'like', $like);
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('type')) {
            $query->where('type', $request->string('type'));
        }

        return InquiryResource::collection($query->latest()->paginate(15));
    }

    public function show(Inquiry $inquiry): InquiryResource
    {
        return new InquiryResource($inquiry->load(['course:id,title,slug', 'notes.author:id,name']));
    }

    public function update(UpdateInquiryRequest $request, Inquiry $inquiry, AuditLogger $audit): InquiryResource
    {
        $from = $inquiry->status;
        $inquiry->update(['status' => $request->validated('status')]);
        $audit->log('inquiry.status', $inquiry, ['from' => $from, 'to' => $inquiry->status]);

        return new InquiryResource($inquiry->load(['course', 'notes.author']));
    }

    public function note(StoreInquiryNoteRequest $request, Inquiry $inquiry, AuditLogger $audit): InquiryResource
    {
        $inquiry->notes()->create([
            'user_id' => $request->user()->id,
            'body' => $request->validated('body'),
        ]);
        $audit->log('inquiry.note', $inquiry);

        return new InquiryResource($inquiry->load(['course', 'notes.author']));
    }

    public function createStudent(Request $request, Inquiry $inquiry, AuditLogger $audit): StudentResource
    {
        abort_unless($request->user()->hasPermission('students.manage'), 403);

        $student = Student::query()->where('inquiry_id', $inquiry->id)->first();

        if ($student === null) {
            try {
                $student = Student::query()->create([
                    'name' => $inquiry->name,
                    'email' => $inquiry->email,
                    'phone' => $inquiry->phone,
                    'status' => 'waitlist',
                    'course_id' => $inquiry->course_id,
                    'inquiry_id' => $inquiry->id,
                    'notes' => 'Created from inquiry #'.$inquiry->id,
                ]);
                $audit->log('student.created_from_inquiry', $student, ['inquiry_id' => $inquiry->id]);
            } catch (UniqueConstraintViolationException) {
                $student = Student::query()->where('inquiry_id', $inquiry->id)->first();

                if ($student === null) {
                    throw ValidationException::withMessages([
                        'email' => 'A student with this email already exists. A second course needs an enrolment record, which is not available yet.',
                    ]);
                }
            }
        }

        return (new StudentResource($student->load('course')))->additional([
            'created' => $student->wasRecentlyCreated,
        ]);
    }
}
