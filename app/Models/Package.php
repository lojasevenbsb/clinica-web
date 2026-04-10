<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Package extends Model
{
    protected $fillable = [
        'specialty_id',
        'name',
        'session_count',
        'sessions_per_week',
        'price',
        'duration_months',
        'duration_value',
        'duration_unit',
    ];

    protected $casts = [
        'duration_months' => 'integer',
        'duration_value' => 'integer',
    ];

    public function specialty()
    {
        return $this->belongsTo(Specialty::class);
    }
}
