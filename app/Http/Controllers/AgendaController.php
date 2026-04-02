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
        
        // Default to 'all' if no professional selected, or pick the first one if preferred.
        // The user wants a global view, so defaulting to 'all' might be best.
        if (!$professionalId) {
            $professionalId = 'all';
        }

        $query = Appointment::with(['patient', 'specialty', 'professional'])
            ->whereDate('start_time', $date);

        if ($professionalId !== 'all') {
            $query->where('professional_id', $professionalId);
            $selectedProfessional = Professional::with('hours')->find($professionalId);
            $hours = $selectedProfessional ? $selectedProfessional->hours : [];
        } else {
            // Fetch global clinic hours for the 'all' view
            $dayName = $date->format('l');
            $daysTranslations = [
                'Monday' => 'Segunda-feira',
                'Tuesday' => 'Terça-feira',
                'Wednesday' => 'Quarta-feira',
                'Thursday' => 'Quinta-feira',
                'Friday' => 'Sexta-feira',
                'Saturday' => 'Sábado',
                'Sunday' => 'Domingo',
            ];
            $translatedDay = $daysTranslations[$dayName];
            $hours = ClinicHour::where('day_of_week', $translatedDay)->get();
            $selectedProfessional = null;
        }

        $appointments = $query->orderBy('start_time')->get();
        
        return Inertia::render('Agenda', [
            'professionals' => $professionals,
            'patients' => Patient::orderBy('name')->get(),
            'specialties' => Specialty::orderBy('name')->get(),
            'appointments' => $appointments,
            'professionalHours' => $hours,
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

        // Professional's specific hours validation
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
        $professional = Professional::findOrFail($request->professional_id);
        $hourConfig = $professional->hours()->where('day_of_week', $dayName)->first();

        if (!$hourConfig || !$hourConfig->is_open) {
            return redirect()->back()->withErrors(['start_time' => "O profissional não atende aos {$dayName}s."]);
        }

        $openTime = Carbon::createFromFormat('H:i:s', $hourConfig->open_time)->setDateFrom($startTime);
        $closeTime = Carbon::createFromFormat('H:i:s', $hourConfig->close_time)->setDateFrom($startTime);

        if ($startTime->lt($openTime) || $endTime->gt($closeTime)) {
            return redirect()->back()->withErrors([
                'start_time' => "Horário fora do expediente do profissional. Atendimento: {$openTime->format('H:i')} às {$closeTime->format('H:i')}."
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
            'professional_id' => 'required|exists:professionals,id',
            'patient_id' => 'required|exists:patients,id',
            'specialty_id' => 'required|exists:specialties,id',
            'start_time' => 'required|date',
            'notes' => 'nullable|string',
        ]);

        $startTime = Carbon::parse($request->start_time);
        $specialty = Specialty::findOrFail($request->specialty_id);
        $endTime = $startTime->copy()->addMinutes($specialty->duration_minutes);

        // Professional's specific hours validation (reused from store)
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
        $professional = Professional::findOrFail($request->professional_id);
        $hourConfig = $professional->hours()->where('day_of_week', $dayName)->first();

        if (!$hourConfig || !$hourConfig->is_open) {
            return redirect()->back()->withErrors(['start_time' => "O profissional não atende aos {$dayName}s."]);
        }

        $openTime = Carbon::createFromFormat('H:i:s', $hourConfig->open_time)->setDateFrom($startTime);
        $closeTime = Carbon::createFromFormat('H:i:s', $hourConfig->close_time)->setDateFrom($startTime);

        if ($startTime->lt($openTime) || $endTime->gt($closeTime)) {
            return redirect()->back()->withErrors([
                'start_time' => "Horário fora do expediente do profissional. Atendimento: {$openTime->format('H:i')} às {$closeTime->format('H:i')}."
            ]);
        }

        $validated['end_time'] = $endTime;
        $appointment->update($validated);

        return redirect()->back()->with('success', 'Agendamento atualizado com sucesso!');
    }

    public function destroy(Appointment $appointment)
    {
        $appointment->delete();
        return redirect()->back()->with('success', 'Agendamento removido!');
    }
}
