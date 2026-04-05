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
        'session_count',
        'payment_type',
        'payment_method',
        'status',
        'payment_status',
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

    public function installments()
    {
        return $this->hasMany(PatientPackageInstallment::class)->orderBy('numero');
    }
}
