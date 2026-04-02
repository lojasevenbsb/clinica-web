<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Professional;
use Inertia\Inertia;

class ProfessionalController extends Controller
{
    public function index()
    {
        return Inertia::render('Professionals/Index', [
            'professionals' => Professional::all()
        ]);
    }

    public function create()
    {
        return Inertia::render('Professionals/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'specialty' => 'required|string|max:255',
            'registration_number' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'color' => 'required|string|max:7',
        ]);

        Professional::create($validated);

        return redirect()->route('professionals.index')->with('success', 'Profissional cadastrado com sucesso!');
    }
}
