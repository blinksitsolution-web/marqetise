<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'name', 'slug', 'summary', 'description', 'icon', 'starting_price',
    'duration_label', 'status', 'sort_order',
])]
class Service extends Model
{
    protected function casts(): array
    {
        return [
            'starting_price' => 'decimal:2',
        ];
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    public function scopePublished($query)
    {
        return $query->where('status', 'published');
    }
}
