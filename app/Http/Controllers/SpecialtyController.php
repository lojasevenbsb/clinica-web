<?php

namespace App\Http\Controllers;

use App\Models\Specialty;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SpecialtyController extends Controller
{
    public function index()
    {
        return Inertia::render('Specialties/Index', [
            'specialties' => Specialty::orderBy('name')->get()
        ]);
    }

    public function create()
    {
        return Inertia::render('Specialties/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:specialties,name',
            'duration_minutes' => 'required|integer|min:1|max:480',
        ]);

        Specialty::create($validated);

        return redirect()->route('specialties.index')->with('success', 'Especialidade cadastrada com sucesso!');
    }

    public function edit(Specialty $specialty)
    {
        return Inertia::render('Specialties/Edit', [
            'specialty' => $specialty
        ]);
    }

    public function update(Request $request, Specialty $specialty)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:specialties,name,' . $specialty->id,
            'duration_minutes' => 'required|integer|min:1|max:480',
        ]);

        $specialty->update($validated);

        return redirect()->route('specialties.index')->with('success', 'Especialidade atualizada com sucesso!');
    }

    public function destroy(Specialty $specialty)
    {
        // Add check if specialty is in use by any professional could be good, but for now we delete it
        $specialty->delete();

        return redirect()->route('specialties.index')->with('success', 'Especialidade excluída com sucesso!');
    }
}
