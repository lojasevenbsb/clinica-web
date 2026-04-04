<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PatientPackage extends Model
{
    use HasFactory;

    protected $fillable = [
        'patient_id',
        'package_id',
        'start_date',
        'end_date',
        'billing_day',
        'price',
        'status',
        'notes',
    ];

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function package()
    {
        return $this->belongsTo(Package::class);
    }
}
