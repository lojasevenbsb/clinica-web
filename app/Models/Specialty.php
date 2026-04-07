<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Specialty extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'color', 'duration_minutes'];

    public function professionals()
    {
        return $this->belongsToMany(Professional::class);
    }

    public function packages()
    {
        return $this->hasMany(Package::class);
    }

    public function subgroups()
    {
        return $this->hasMany(SpecialtySubgroup::class)->orderBy('name');
    }
}
