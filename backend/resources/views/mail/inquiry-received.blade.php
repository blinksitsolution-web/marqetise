New website inquiry

Name: {{ $inquiry->name }}
Email: {{ $inquiry->email }}
Phone: {{ $inquiry->phone ?: 'Not provided' }}
Type: {{ $inquiry->type }}
Subject: {{ $inquiry->subject }}
@if ($inquiry->course)
Course: {{ $inquiry->course->title }}
@endif

{{ $inquiry->message }}
