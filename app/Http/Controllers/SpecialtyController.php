<?php

namespace App\Http\Controllers;

use App\Models\Specialty;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SpecialtyController extends Controller
{
    public function list()
    {
        return response()->json(Specialty::with('packages')->orderBy('name')->get());
    }

    public function index()
    {
        return Inertia::render('Specialties/Index', [
            'specialties' => Specialty::with('subgroups')->orderBy('name')->get()
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
            'color' => 'required|string|max:7',
            'duration_minutes' => 'nullable|integer|min:1',
            'capacity' => 'nullable|integer|min:1',
        ]);

        Specialty::create($validated);

        return redirect()->route('specialties.index')->with('success', 'Especialidade cadastrada com sucesso!');
    }

    public function edit(Specialty $specialty)
    {
        return Inertia::render('Specialties/Edit', [
            'specialty' => $specialty->load('subgroups')
        ]);
    }

    public function update(Request $request, Specialty $specialty)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:specialties,name,' . $specialty->id,
            'color' => 'required|string|max:7',
            'duration_minutes' => 'nullable|integer|min:1',
            'capacity' => 'nullable|integer|min:1',
        ]);

        $specialty->update($validated);

        return redirect()->route('specialties.index')->with('success', 'Especialidade atualizada com sucesso!');
    }

    public function destroy(Specialty $specialty)
    {
        $specialty->delete();

        return redirect()->route('specialties.index')->with('success', 'Especialidade excluída com sucesso!');
    }
}
