<?php

namespace App\Http\Controllers;

use App\Models\Package;
use App\Models\Specialty;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PilatesPackageController extends Controller
{
    const PERIODS = [
        'mensal'     => ['value' => 1,  'label' => 'Mensal'],
        'trimestral' => ['value' => 3,  'label' => 'Trimestral'],
        'semestral'  => ['value' => 6,  'label' => 'Semestral'],
        'anual'      => ['value' => 12, 'label' => 'Anual'],
    ];

    const FREQUENCIES = [1, 2, 3];

    private function pilatesSpecialties()
    {
        return Specialty::whereRaw('LOWER(name) LIKE ?', ['%pilates%'])->orderBy('name')->get(['id', 'name']);
    }

    public function index()
    {
        $specialties = $this->pilatesSpecialties();
        $specialtyIds = $specialties->pluck('id');

        $packages = Package::whereIn('specialty_id', $specialtyIds)
            ->orderBy('name')
            ->get(['id', 'specialty_id', 'name', 'price', 'duration_value', 'duration_unit', 'sessions_per_week']);

        return Inertia::render('Pilates/Planos/Index', [
            'packages'    => $packages,
            'specialties' => $specialties,
            'periods'     => self::PERIODS,
            'frequencies' => self::FREQUENCIES,
        ]);
    }

    public function saveMatrix(Request $request)
    {
        $validated = $request->validate([
            'specialty_id'           => 'required|exists:specialties,id',
            'matrix'                 => 'required|array',
            'matrix.*.period'        => 'required|in:mensal,trimestral,semestral,anual',
            'matrix.*.frequency'     => 'required|integer|in:1,2,3',
            'matrix.*.price'         => 'nullable|numeric|min:0',
        ]);

        foreach ($validated['matrix'] as $item) {
            $period = self::PERIODS[$item['period']];
            $freq   = (int) $item['frequency'];
            $name   = "{$period['label']} {$freq}x na Semana";

            if ($item['price'] === null || $item['price'] === '') {
                // Remove plano se preço vazio
                Package::where('specialty_id', $validated['specialty_id'])
                    ->where('duration_value', $period['value'])
                    ->where('duration_unit', 'months')
                    ->where('sessions_per_week', $freq)
                    ->delete();
                continue;
            }

            Package::updateOrCreate(
                [
                    'specialty_id'      => $validated['specialty_id'],
                    'duration_value'    => $period['value'],
                    'duration_unit'     => 'months',
                    'sessions_per_week' => $freq,
                ],
                [
                    'name'  => $name,
                    'price' => $item['price'],
                ]
            );
        }

        return back();
    }

    public function destroy(Package $package)
    {
        $package->delete();

        return back();
    }
}
