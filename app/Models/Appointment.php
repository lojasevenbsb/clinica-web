<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Appointment extends Model
{
    use HasFactory;

    protected $fillable = [
        'professional_id',
        'patient_id',
        'specialty_id',
        'specialty_subgroup_id',
        'patient_package_id',
        'start_time',
        'end_time',
        'status',
        'notes',
        'repeat_group_id',
    ];

    protected $casts = [
        'start_time' => 'datetime',
        'end_time' => 'datetime',
    ];

    public function professional()
    {
        return $this->belongsTo(Professional::class);
    }

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function specialty()
    {
        return $this->belongsTo(Specialty::class);
    }

    public function specialtySubgroup()
    {
        return $this->belongsTo(SpecialtySubgroup::class);
    }

    public function patientPackage()
    {
        return $this->belongsTo(PatientPackage::class);
    }
}
