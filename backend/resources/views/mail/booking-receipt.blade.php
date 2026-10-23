We received your booking request {{ $booking->reference }}.

Service: {{ $booking->service_name }}
When: {{ $booking->preferred_date?->toDateString() }} {{ $booking->preferred_time }}
Format: {{ $booking->format }}

This request is pending. It is not a confirmed appointment.
