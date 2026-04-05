<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PatientPackageInstallment extends Model
{
    protected $fillable = ['patient_package_id', 'numero', 'due_date', 'amount', 'paid'];

    protected $casts = ['paid' => 'boolean', 'due_date' => 'date'];

    public function patientPackage()
    {
        return $this->belongsTo(PatientPackage::class);
    }
}
