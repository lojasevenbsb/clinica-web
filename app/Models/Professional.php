<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Professional extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'specialty',
        'registration_number',
        'email',
        'phone',
        'color',
        'is_active',
    ];
}
