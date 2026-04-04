<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Package extends Model
{
    protected $fillable = [
        'specialty_id',
        'name',
        'session_count',
        'price',
    ];

    public function specialty()
    {
        return $this->belongsTo(Specialty::class);
    }
}
