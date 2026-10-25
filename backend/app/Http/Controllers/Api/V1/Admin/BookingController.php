<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateBookingRequest;
use App\Http\Resources\BookingResource;
use App\Models\Booking;
use App\Services\AuditLogger;
use App\Services\BookingSlot;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

class BookingController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Booking::query()->with('assignee:id,name');

        if ($search = trim((string) $request->query('search', ''))) {
            $like = '%'.addcslashes($search, '%_\\').'%';
            $query->where(function ($inner) use ($like) {
                $inner->where('name', 'like', $like)
                    ->orWhere('email', 'like', $like)
                    ->orWhere('reference', 'like', $like)
                    ->orWhere('service_name', 'like', $like);
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('from')) {
            $query->whereDate('preferred_date', '>=', $request->date('from'));
        }

        if ($request->filled('to')) {
            $query->whereDate('preferred_date', '<=', $request->date('to'));
        }

        if (! $request->filled('status')) {
            $query->orderByRaw(
                "CASE WHEN status IN ('pending', 'confirmed') AND preferred_date >= ? THEN 0 ELSE 1 END",
                [now()->toDateString()],
            );
        }

        return BookingResource::collection(
            $query->orderBy('preferred_date')->orderBy('preferred_time')->paginate(15)
        );
    }

    public function show(Booking $booking): BookingResource
    {
        return new BookingResource($booking->load('assignee:id,name'));
    }

    public function update(UpdateBookingRequest $request, Booking $booking, AuditLogger $audit, BookingSlot $slots): BookingResource
    {
        $from = $booking->status;

        try {
            DB::transaction(function () use ($request, $booking, $slots): void {
                $changes = $request->validated();

                if (in_array($changes['status'], ['pending', 'confirmed'], true)) {
                    $slots->assertAvailable(
                        $booking->preferred_date->toDateString(),
                        (string) $booking->preferred_time,
                        $booking->id,
                        'status',
                    );
                }

                $booking->update($changes);
            });
        } catch (UniqueConstraintViolationException $exception) {
            $slots->denyIfSlotTaken($exception, 'status');
        }

        $audit->log('booking.updated', $booking, ['from' => $from, 'to' => $booking->status]);

        return new BookingResource($booking->load('assignee'));
    }
}
