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
        'is_walk_in',
    ];

    protected $casts = [
        'birth_date' => 'date:Y-m-d',
        'is_walk_in' => 'boolean',
    ];

    public function packages()
    {
        return $this->hasMany(PatientPackage::class);
    }
}
