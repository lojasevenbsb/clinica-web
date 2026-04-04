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
            'price' => 'required|numeric|min:0',
            'session_count' => 'nullable|integer|min:1',
            'payment_type' => 'nullable|string',
            'payment_method' => 'nullable|string',
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
