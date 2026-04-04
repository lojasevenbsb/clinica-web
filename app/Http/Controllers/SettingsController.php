<?php

namespace App\Http\Controllers;

use App\Models\ClinicHour;
use App\Models\Specialty;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SettingsController extends Controller
{
    public function agenda()
    {
        return Inertia::render('Settings/Agenda', [
            'clinicHours' => ClinicHour::all()
        ]);
    }

    public function packages()
    {
        return Inertia::render('Settings/Packages', [
            'specialties' => Specialty::with('packages')->orderBy('name')->get()
        ]);
    }

    public function updateAgenda(Request $request)
    {
        $validated = $request->validate([
            'hours' => 'required|array',
            'hours.*.id' => 'required|exists:clinic_hours,id',
            'hours.*.is_open' => 'required|boolean',
            'hours.*.open_time' => 'required|string',
            'hours.*.close_time' => 'required|string',
        ]);

        foreach ($validated['hours'] as $hourData) {
            $clinicHour = ClinicHour::find($hourData['id']);
            if ($clinicHour) {
                $clinicHour->update([
                    'is_open' => $hourData['is_open'],
                    'open_time' => $hourData['open_time'],
                    'close_time' => $hourData['close_time'],
                ]);
            }
        }

        return redirect()->back()->with('success', 'Configurações de agenda atualizadas!');
    }
}
