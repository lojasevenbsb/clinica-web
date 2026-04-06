<?php

namespace App\Http\Controllers;

use App\Models\Package;
use App\Models\Specialty;
use Illuminate\Http\Request;

class PackageController extends Controller
{
    public function index(?Specialty $specialty = null)
    {
        if ($specialty) {
            return response()->json($specialty->packages);
        }

        $packages = Package::with('specialty')->orderBy('name')->get()
            ->map(fn($p) => array_merge($p->toArray(), [
                'specialty_name' => $p->specialty?->name,
            ]));

        return response()->json($packages);
    }

    public function store(Request $request, ?Specialty $specialty = null)
    {
        $validated = $request->validate([
            'name'          => 'required|string|max:255',
            'session_count' => 'nullable|integer|min:1',
            'price'         => 'required|numeric|min:0',
            'duration_value'=> 'nullable|integer|min:1',
            'duration_unit' => 'nullable|in:minutes,months,sessions',
            'specialty_id'  => 'nullable|exists:specialties,id',
        ]);

        if (empty($validated['duration_value'])) {
            $validated['duration_value'] = null;
            $validated['duration_unit'] = null;
        }

        $validated['duration_months'] = ($validated['duration_unit'] ?? null) === 'months'
            ? $validated['duration_value']
            : null;

        if ($specialty) {
            $package = $specialty->packages()->create($validated);
        } else {
            $package = Package::create($validated);
        }

        return response()->json($package);
    }

    public function update(Request $request, Package $package)
    {
        $validated = $request->validate([
            'name'          => 'required|string|max:255',
            'session_count' => 'nullable|integer|min:1',
            'price'         => 'required|numeric|min:0',
            'duration_value'=> 'nullable|integer|min:1',
            'duration_unit' => 'nullable|in:minutes,months,sessions',
            'specialty_id'  => 'nullable|exists:specialties,id',
        ]);

        if (empty($validated['duration_value'])) {
            $validated['duration_value'] = null;
            $validated['duration_unit'] = null;
        }

        $validated['duration_months'] = ($validated['duration_unit'] ?? null) === 'months'
            ? $validated['duration_value']
            : null;

        $package->update($validated);

        return response()->json($package->fresh()->load('specialty'));
    }

    public function destroy(Package $package)
    {
        $package->delete();

        return response()->json(['ok' => true]);
    }
}
