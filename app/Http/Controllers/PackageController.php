<?php

namespace App\Http\Controllers;

use App\Models\Package;
use App\Models\Specialty;
use Illuminate\Http\Request;

class PackageController extends Controller
{
    public function index(Specialty $specialty)
    {
        return response()->json($specialty->packages);
    }

    public function store(Request $request, Specialty $specialty)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'session_count' => 'nullable|integer|min:1',
            'price' => 'required|numeric|min:0',
        ]);

        $specialty->packages()->create($validated);

        return back()->with('success', 'Pacote criado com sucesso!');
    }

    public function destroy(Package $package)
    {
        $package->delete();

        return back()->with('success', 'Pacote excluído com sucesso!');
    }
}
