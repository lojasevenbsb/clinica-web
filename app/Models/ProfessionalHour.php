<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProfessionalHour extends Model
{
    use HasFactory;

    protected $fillable = [
        'professional_id',
        'day_of_week',
        'is_open',
        'open_time',
        'close_time',
    ];

    protected $casts = [
        'is_open' => 'boolean',
    ];

    public function professional()
    {
        return $this->belongsTo(Professional::class);
    }
}
