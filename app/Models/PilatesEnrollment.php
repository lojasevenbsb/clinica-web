<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PilatesEnrollment extends Model
{
    protected $fillable = [
        'enrollment_number',
        'patient_id',
        'package_id',
        'contract_number',
        'start_date',
        'end_date',
        'price',
        'sessions_per_month',
        'payment_method_id',
        'payment_type_id',
        'status',
        'notes',
    ];

    protected $casts = [
        'start_date' => 'date:Y-m-d',
        'end_date'   => 'date:Y-m-d',
        'price'      => 'decimal:2',
    ];

    public static function generateEnrollmentNumber(): string
    {
        $year  = now()->year;
        $count = static::whereYear('created_at', $year)->count() + 1;
        return 'MAT-' . $year . '-' . str_pad($count, 4, '0', STR_PAD_LEFT);
    }

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
        return $this->hasMany(PilatesEnrollmentInstallment::class)->orderBy('numero');
    }

    public function paymentMethod()
    {
        return $this->belongsTo(PaymentOption::class, 'payment_method_id');
    }

    public function paymentType()
    {
        return $this->belongsTo(PaymentOption::class, 'payment_type_id');
    }
}
