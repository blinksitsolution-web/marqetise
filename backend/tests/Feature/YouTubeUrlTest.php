<?php

namespace Tests\Feature;

use App\Support\MediaUpload;
use App\Support\YouTubeUrl;
use PHPUnit\Framework\TestCase;

class YouTubeUrlTest extends TestCase
{
    public function test_it_normalizes_youtube_links_to_an_embed_url(): void
    {
        $embed = 'https://www.youtube.com/embed/Lplq8RjQ0zU';
        $cases = [
            'https://www.youtube.com/watch?v=Lplq8RjQ0zU',
            'http://youtube.com/watch?v=Lplq8RjQ0zU&t=12s',
            'https://m.youtube.com/watch?v=Lplq8RjQ0zU',
            'https://music.youtube.com/watch?v=Lplq8RjQ0zU',
            'https://youtu.be/Lplq8RjQ0zU',
            'https://www.youtube.com/shorts/Lplq8RjQ0zU',
            'https://www.youtube.com/embed/Lplq8RjQ0zU',
            'https://www.youtube.com/live/Lplq8RjQ0zU',
            'https://www.youtube-nocookie.com/embed/Lplq8RjQ0zU',
            '  https://www.youtube.com/watch?v=Lplq8RjQ0zU  ',
        ];

        foreach ($cases as $input) {
            $this->assertSame($embed, YouTubeUrl::embed($input), $input);
        }
    }

    public function test_it_rejects_links_that_are_not_a_youtube_video(): void
    {
        $cases = [
            '',
            'javascript:alert(1)',
            'https://evil.example/watch?v=Lplq8RjQ0zU',
            'https://www.youtube.com/watch?v=short',
            'https://www.youtube.com/watch?v=Lplq8RjQ0zUX',
            'https://www.youtube.com/watch?v=Lplq8 RjQ0zU',
            'https://youtu.be/not-an-id',
            'https://www.youtube.com/watch?v=<script>',
            '/media/1-'.str_repeat('a', 64).'.mp4',
        ];

        foreach ($cases as $input) {
            $this->assertNull(YouTubeUrl::embed($input), $input);
        }
    }

    public function test_video_uploads_have_a_separate_size_limit_from_images(): void
    {
        $this->assertNull(MediaUpload::rejection('video/mp4', 25 * 1024 * 1024));
        $this->assertNull(MediaUpload::rejection('video/webm', 1024));
        $this->assertNull(MediaUpload::rejection('video/quicktime', 1024));
        $this->assertNull(MediaUpload::rejection('application/mp4', 1024));
        $this->assertSame('mp4', MediaUpload::extension('video/mp4'));
        $this->assertSame('webm', MediaUpload::extension('video/webm'));
        $this->assertSame('mov', MediaUpload::extension('video/quicktime'));
        $this->assertSame(
            'The video must be 25 MB or smaller.',
            MediaUpload::rejection('video/mp4', 25 * 1024 * 1024 + 1),
        );
        $this->assertSame(
            'The image must be 5 MB or smaller.',
            MediaUpload::rejection('image/png', 5 * 1024 * 1024 + 1),
        );
        $this->assertSame(
            'Use a JPEG, PNG, or WebP image, or an MP4, WebM, or MOV video.',
            MediaUpload::rejection('image/gif', 100),
        );
        $this->assertSame(
            'Use a JPEG, PNG, or WebP image, or an MP4, WebM, or MOV video.',
            MediaUpload::rejection('text/plain', 100),
        );
    }
}
