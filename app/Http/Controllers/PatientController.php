<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Patient;
use App\Models\Professional;
use App\Models\Package;
use App\Models\Specialty;
use Inertia\Inertia;

class PatientController extends Controller
{
    public function index(Request $request)
    {
        $query = Patient::query();

        if ($request->search) {
            $query->where('name', 'like', "%{$request->search}%")
                  ->orWhere('cpf', 'like', "%{$request->search}%");
        }

        return Inertia::render('Patients/Index', [
            'patients'      => $query->with(['packages.package'])->latest()->get(),
            'filters'       => $request->only(['search']),
            'professionals' => Professional::with(['hours', 'specialties'])->get(),
            'specialties'   => Specialty::with('subgroups')->orderBy('name')->get(),
            'packages'      => Package::orderBy('name')->get(['id', 'name', 'specialty_id', 'price', 'session_count']),
        ]);
    }

    public function create()
    {
        return Inertia::render('Patients/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'birth_date' => 'required|date',
            'cpf' => 'required|string|unique:patients,cpf',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
        ]);

        Patient::create($validated);

        return redirect()->route('patients.index')->with('success', 'Paciente cadastrado com sucesso!');
    }

    public function edit(Patient $patient)
    {
        return Inertia::render('Patients/Edit', [
            'patient' => $patient
        ]);
    }

    public function update(Request $request, Patient $patient)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'birth_date' => 'required|date',
            'cpf' => 'required|string|unique:patients,cpf,' . $patient->id,
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
        ]);

        $patient->update($validated);

        return redirect()->route('patients.index')->with('success', 'Paciente atualizado com sucesso!');
    }

    public function destroy(Patient $patient)
    {
        $patient->delete();

        return redirect()->route('patients.index')->with('success', 'Paciente excluído com sucesso!');
    }
}
