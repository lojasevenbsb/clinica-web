<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SpecialtySubgroup extends Model
{
    protected $fillable = ['specialty_id', 'name'];

    public function specialty()
    {
        return $this->belongsTo(Specialty::class);
    }
}
