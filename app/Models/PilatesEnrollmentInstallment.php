<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PilatesEnrollmentInstallment extends Model
{
    protected $fillable = [
        'pilates_enrollment_id',
        'numero',
        'due_date',
        'amount',
        'paid',
        'paid_at',
    ];

    protected $casts = [
        'due_date' => 'date:Y-m-d',
        'paid_at'  => 'date:Y-m-d',
        'paid'     => 'boolean',
        'amount'   => 'decimal:2',
    ];

    public function enrollment()
    {
        return $this->belongsTo(PilatesEnrollment::class, 'pilates_enrollment_id');
    }
}
