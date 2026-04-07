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
            'nickname' => 'nullable|string|max:255',
            'registration_number' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'color' => 'required|string|max:7',
            'specialties' => 'required|array|min:1',
            'specialties.*' => 'exists:specialties,id',
            'hours' => 'required|array|size:7',
            'hours.*.day_of_week' => 'required|string',
            'hours.*.is_open' => 'required|boolean',
            'hours.*.open_time' => 'required|string',
            'hours.*.close_time' => 'required|string',
        ]);

        $professional = Professional::create($validated);
        $professional->specialties()->sync($request->specialties);

        foreach ($request->hours as $hour) {
            $professional->hours()->create($hour);
        }

        return redirect()->route('professionals.index')->with('success', 'Profissional cadastrado com sucesso!');
    }

    public function edit(Professional $professional)
    {
        return Inertia::render('Professionals/Edit', [
            'professional' => $professional->load(['specialties', 'hours']),
            'specialties' => Specialty::orderBy('name')->get()
        ]);
    }

    public function update(Request $request, Professional $professional)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'nickname' => 'nullable|string|max:255',
            'registration_number' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'color' => 'required|string|max:7',
            'specialties' => 'required|array|min:1',
            'specialties.*' => 'exists:specialties,id',
            'hours' => 'required|array|size:7',
            'hours.*.day_of_week' => 'required|string',
            'hours.*.is_open' => 'required|boolean',
            'hours.*.open_time' => 'required|string',
            'hours.*.close_time' => 'required|string',
        ]);

        $professional->update($validated);
        $professional->specialties()->sync($request->specialties);

        foreach ($request->hours as $hour) {
            $professional->hours()->updateOrCreate(
                ['day_of_week' => $hour['day_of_week']],
                [
                    'is_open' => $hour['is_open'],
                    'open_time' => $hour['open_time'],
                    'close_time' => $hour['close_time'],
                ]
            );
        }

        return redirect()->route('professionals.index')->with('success', 'Profissional atualizado com sucesso!');
    }

    public function destroy(Professional $professional)
    {
        $professional->delete();

        return redirect()->route('professionals.index')->with('success', 'Profissional excluído com sucesso!');
    }
}
