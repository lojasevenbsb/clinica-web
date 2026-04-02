<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Professional;
use App\Models\Specialty;
use Inertia\Inertia;

class ProfessionalController extends Controller
{
    public function index()
    {
        return Inertia::render('Professionals/Index', [
            'professionals' => Professional::with('specialties')->latest()->get()
        ]);
    }

    public function create()
    {
        return Inertia::render('Professionals/Create', [
            'specialties' => Specialty::orderBy('name')->get()
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'registration_number' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'color' => 'required|string|max:7',
            'specialties' => 'required|array|min:1',
            'specialties.*' => 'exists:specialties,id',
        ]);

        $professional = Professional::create($validated);
        $professional->specialties()->sync($request->specialties);

        return redirect()->route('professionals.index')->with('success', 'Profissional cadastrado com sucesso!');
    }
}
