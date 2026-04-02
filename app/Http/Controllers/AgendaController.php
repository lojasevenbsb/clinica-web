<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Patient;
use App\Models\Professional;
use App\Models\Specialty;
use App\Models\ClinicHour;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AgendaController extends Controller
{
    public function index(Request $request)
    {
        $date = $request->date ? Carbon::parse($request->date) : Carbon::today();
        $professionalId = $request->professional_id;

        $professionals = Professional::all();
        
        // If no professional selected, pick the first one
        if (!$professionalId && $professionals->count() > 0) {
            $professionalId = $professionals->first()->id;
        }

        $appointments = Appointment::with(['patient', 'specialty'])
            ->where('professional_id', $professionalId)
            ->whereDate('start_time', $date)
            ->orderBy('start_time')
            ->get();

        return Inertia::render('Agenda', [
            'professionals' => $professionals,
            'patients' => Patient::orderBy('name')->get(),
            'specialties' => Specialty::orderBy('name')->get(),
            'appointments' => $appointments,
            'clinicHours' => ClinicHour::all(),
            'filters' => [
                'date' => $date->format('Y-m-d'),
                'professional_id' => $professionalId,
            ]
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'professional_id' => 'required|exists:professionals,id',
            'patient_id' => 'required|exists:patients,id',
            'specialty_id' => 'required|exists:specialties,id',
            'start_time' => 'required|date',
            'notes' => 'nullable|string',
        ]);

        $startTime = Carbon::parse($request->start_time);
        $specialty = Specialty::findOrFail($request->specialty_id);
        $endTime = $startTime->copy()->addMinutes($specialty->duration_minutes);

        // Clinic hours validation
        $daysTranslations = [
            'Monday' => 'Segunda-feira',
            'Tuesday' => 'Terça-feira',
            'Wednesday' => 'Quarta-feira',
            'Thursday' => 'Quinta-feira',
            'Friday' => 'Sexta-feira',
            'Saturday' => 'Sábado',
            'Sunday' => 'Domingo',
        ];

        $dayName = $daysTranslations[$startTime->format('l')];
        $clinicHour = ClinicHour::where('day_of_week', $dayName)->first();

        if (!$clinicHour || !$clinicHour->is_open) {
            return redirect()->back()->withErrors(['start_time' => "A clínica está fechada aos {$dayName}s."]);
        }

        $openTime = Carbon::createFromFormat('H:i:s', $clinicHour->open_time)->setDateFrom($startTime);
        $closeTime = Carbon::createFromFormat('H:i:s', $clinicHour->close_time)->setDateFrom($startTime);

        if ($startTime->lt($openTime) || $endTime->gt($closeTime)) {
            return redirect()->back()->withErrors([
                'start_time' => "Horário fora do expediente. Funcionamento: {$openTime->format('H:i')} às {$closeTime->format('H:i')}."
            ]);
        }

        $validated['end_time'] = $endTime;

        Appointment::create($validated);

        return redirect()->back()->with('success', 'Agendamento realizado com sucesso!');
    }

    public function update(Request $request, Appointment $appointment)
    {
        $validated = $request->validate([
            'status' => 'required|string|in:pendente,confirmado,cancelado,atendido',
        ]);

        $appointment->update($validated);

        return redirect()->back()->with('success', 'Status atualizado!');
    }

    public function destroy(Appointment $appointment)
    {
        $appointment->delete();
        return redirect()->back()->with('success', 'Agendamento removido!');
    }
}
