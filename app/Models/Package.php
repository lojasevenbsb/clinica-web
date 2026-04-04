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
        'billing_day',
        'start_date',
        'end_date'
    ];

    public function specialty()
    {
        return $this->belongsTo(Specialty::class);
    }
}
