<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SpecialtySubgroup extends Model
{
    protected $fillable = ['specialty_id', 'name', 'duration_minutes', 'capacity'];

    public function specialty()
    {
        return $this->belongsTo(Specialty::class);
    }
}
