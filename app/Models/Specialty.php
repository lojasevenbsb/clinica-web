<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Specialty extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'duration_minutes'];

    public function professionals()
    {
        return $this->belongsToMany(Professional::class);
    }
}
