<?php

namespace App\Http\Controllers;

use App\Models\Specialty;
use App\Models\SpecialtySubgroup;
use Illuminate\Http\Request;

class SpecialtySubgroupController extends Controller
{
    public function store(Request $request, Specialty $specialty)
    {
        $validated = $request->validate([
            'name'             => 'required|string|max:255',
            'duration_minutes' => 'nullable|integer|min:1',
        ]);

        $specialty->subgroups()->create($validated);

        return back()->with('success', 'Subgrupo adicionado.');
    }

    public function update(Request $request, Specialty $specialty, SpecialtySubgroup $subgroup)
    {
        $validated = $request->validate([
            'name'             => 'required|string|max:255',
            'duration_minutes' => 'nullable|integer|min:1',
        ]);

        $subgroup->update($validated);

        return back()->with('success', 'Subgrupo atualizado.');
    }

    public function destroy(Specialty $specialty, SpecialtySubgroup $subgroup)
    {
        $subgroup->delete();

        return back()->with('success', 'Subgrupo removido.');
    }
}
