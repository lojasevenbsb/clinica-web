<?php

namespace App\Http\Controllers;

use App\Models\Patient;
use App\Models\PatientPackage;
use App\Models\Specialty;
use Illuminate\Http\Request;

class PatientPackageController extends Controller
{
    public function index(Patient $patient)
    {
        return $patient->packages()->with('package.specialty')->get();
    }

    public function store(Request $request, Patient $patient)
    {
        $validated = $request->validate([
            'package_id' => 'required|exists:packages,id',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date',
            'billing_day' => 'required|integer|min:1|max:31',
            'price' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $patient->packages()->create($validated);

        return redirect()->back()->with('success', 'Pacote atribuído com sucesso!');
    }

    public function specialties()
    {
        return Specialty::with('packages')->has('packages')->get();
    }
}
