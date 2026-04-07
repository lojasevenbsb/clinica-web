<?php

namespace App\Http\Controllers;

use App\Models\Specialty;
use App\Models\SpecialtySubgroup;
use Illuminate\Http\Request;

class SpecialtySubgroupController extends Controller
{
    public function store(Request $request, Specialty $specialty)
    {
        $request->validate(['name' => 'required|string|max:255']);

        $specialty->subgroups()->create(['name' => $request->name]);

        return back()->with('success', 'Subgrupo adicionado.');
    }

    public function destroy(Specialty $specialty, SpecialtySubgroup $subgroup)
    {
        $subgroup->delete();

        return back()->with('success', 'Subgrupo removido.');
    }
}
