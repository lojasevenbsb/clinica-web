<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PilatesAttendance extends Model
{
    protected $fillable = [
        'patient_id',
        'pilates_enrollment_id',
        'date',
        'status',
        'source',
        'appointment_id',
        'facial_confidence',
        'facial_image_path',
        'notes',
    ];

    protected $casts = [
        'date' => 'date',
    ];

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function enrollment()
    {
        return $this->belongsTo(PilatesEnrollment::class, 'pilates_enrollment_id');
    }

    public function appointment()
    {
        return $this->belongsTo(Appointment::class);
    }
}
