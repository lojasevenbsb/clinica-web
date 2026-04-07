<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Professional extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'nickname',
        'registration_number',
        'email',
        'phone',
        'color',
        'is_active',
    ];

    public function specialties()
    {
        return $this->belongsToMany(Specialty::class);
    }

    public function hours()
    {
        return $this->hasMany(ProfessionalHour::class);
    }
}
