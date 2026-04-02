<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Patient extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'birth_date',
        'cpf',
        'email',
        'phone',
        'address',
    ];

    protected $casts = [
        'birth_date' => 'date:Y-m-d',
    ];
}
