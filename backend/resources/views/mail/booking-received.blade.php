New booking request {{ $booking->reference }}

Service: {{ $booking->service_name }}
Name: {{ $booking->name }}
Email: {{ $booking->email }}
Phone: {{ $booking->phone ?: 'Not provided' }}
When: {{ $booking->preferred_date?->toDateString() }} {{ $booking->preferred_time }}
Format: {{ $booking->format }}

{{ $booking->goals }}

This request is pending until a staff member confirms it.
