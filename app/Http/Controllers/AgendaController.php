<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Patient;
use App\Models\Package;
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

        $professionals = Professional::with('hours')->get();

        $daysTranslations = [
            'Monday'    => 'Segunda-feira',
            'Tuesday'   => 'Terça-feira',
            'Wednesday' => 'Quarta-feira',
            'Thursday'  => 'Quinta-feira',
            'Friday'    => 'Sexta-feira',
            'Saturday'  => 'Sábado',
            'Sunday'    => 'Domingo',
        ];
        $translatedDay = $daysTranslations[$date->format('l')];

        // Default to 'all' if no professional selected, or pick the first one if preferred.
        // The user wants a global view, so defaulting to 'all' might be best.
        if (!$professionalId) {
            $professionalId = 'all';
        }

        $query = Appointment::with(['patient', 'specialty', 'professional', 'patientPackage.package'])
            ->whereDate('start_time', $date);

        $allProfessionalsHours = [];

        if ($professionalId !== 'all') {
            $query->where('professional_id', $professionalId);
            $selectedProfessional = Professional::with('hours')->find($professionalId);
            $hours = $selectedProfessional ? $selectedProfessional->hours : [];
        } else {
            $hours = ClinicHour::where('day_of_week', $translatedDay)->get();
            $selectedProfessional = null;

            // Per-professional day hours for the multi-column grid
            $allProfessionalsHours = $professionals->map(function ($prof) use ($translatedDay) {
                $dayHours = $prof->hours()->where('day_of_week', $translatedDay)->first();
                return [
                    'id'        => $prof->id,
                    'name'      => $prof->name,
                    'color'     => $prof->color ?? '#6366f1',
                    'day_hours' => $dayHours ? [
                        'is_open'    => (bool) $dayHours->is_open,
                        'open_time'  => $dayHours->open_time,
                        'close_time' => $dayHours->close_time,
                    ] : null,
                ];
            })->values();
        }

        $appointments = $query->orderBy('start_time')->get();

        // For the "all" mode, also send the full month's appointments for the calendar
        $monthAppointments = [];
        if ($professionalId === 'all') {
            $monthAppointments = Appointment::with(['patient', 'specialty', 'professional', 'patientPackage.package'])
                ->whereBetween('start_time', [
                    $date->copy()->startOfMonth(),
                    $date->copy()->endOfMonth(),
                ])
                ->orderBy('start_time')
                ->get();
        }

        return Inertia::render('Agenda', [
            'professionals' => $professionals,
            'allProfessionalsHours' => $allProfessionalsHours,
            'patients' => Patient::with(['packages.package'])->orderBy('name')->get(),
            'packages' => Package::orderBy('name')->get(['id', 'name', 'specialty_id', 'price', 'session_count']),
            'specialties' => Specialty::orderBy('name')->get(),
            'appointments' => $appointments,
            'monthAppointments' => $monthAppointments,
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
            'professional_id'   => 'required|exists:professionals,id',
            'patient_id'        => 'nullable|exists:patients,id',
            'patient_mode'      => 'nullable|in:registered,walk_in',
            'walk_in_name'      => 'nullable|string|max:255',
            'walk_in_phone'     => 'nullable|string|max:20',
            'walk_in_email'     => 'nullable|email|max:255',
            'walk_in_birth_date'=> 'nullable|date',
            'walk_in_cpf'       => 'nullable|string|max:20|unique:patients,cpf',
            'specialty_id'      => 'required|exists:specialties,id',
            'package_id'        => 'nullable|exists:packages,id',
            'patient_package_id'=> 'nullable|exists:patient_packages,id',
            'start_time'        => 'required|date',
            'notes'             => 'nullable|string',
        ]);

        $patientMode = $validated['patient_mode'] ?? 'registered';
        $patientId = $validated['patient_id'] ?? null;

        if ($patientMode === 'walk_in') {
            $request->validate([
                'walk_in_name' => 'required|string|max:255',
            ]);

            $patient = Patient::create([
                'name' => $validated['walk_in_name'],
                'phone' => $validated['walk_in_phone'] ?? null,
                'email' => $validated['walk_in_email'] ?? null,
                'birth_date' => $validated['walk_in_birth_date'] ?? null,
                'cpf' => $validated['walk_in_cpf'] ?? null,
                'is_walk_in' => true,
            ]);

            $patientId = $patient->id;
        }

        if (!$patientId) {
            return redirect()->back()->withErrors([
                'patient_id' => 'Selecione um paciente cadastrado ou use paciente avulso.',
            ]);
        }

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

        $hasConflict = Appointment::query()
            ->where('professional_id', $validated['professional_id'])
            ->where('status', '!=', 'cancelado')
            ->where(function ($query) use ($startTime, $endTime) {
                $query->where('start_time', '=', $startTime)
                    ->orWhere(function ($overlap) use ($startTime, $endTime) {
                        $overlap->whereNotNull('end_time')
                            ->where('start_time', '<', $endTime)
                            ->where('end_time', '>', $startTime);
                    });
            })
            ->exists();

        if ($hasConflict) {
            return redirect()->back()->withErrors([
                'hour' => 'Horário não disponível, escolha outro horário.',
                'start_time' => 'Horário não disponível, escolha outro horário.',
            ]);
        }

        $patient = Patient::findOrFail($patientId);
        $patientPackageId = $validated['patient_package_id'] ?? null;

        if (!$patientPackageId && !empty($validated['package_id'])) {
            $selectedPackage = Package::findOrFail($validated['package_id']);

            $existingPatientPackage = $patient->packages()
                ->where('package_id', $selectedPackage->id)
                ->where('status', 'active')
                ->latest()
                ->first();

            if ($existingPatientPackage) {
                $patientPackageId = $existingPatientPackage->id;
            } else {
                $newPatientPackage = $patient->packages()->create([
                    'package_id' => $selectedPackage->id,
                    'start_date' => $startTime->toDateString(),
                    'end_date' => null,
                    'billing_day' => null,
                    'price' => $selectedPackage->price,
                    'session_count' => $selectedPackage->session_count,
                    'status' => 'active',
                    'payment_status' => 'pending',
                    'notes' => 'Plano vinculado automaticamente no agendamento.',
                ]);

                $patientPackageId = $newPatientPackage->id;
            }
        }

        Appointment::create([
            'professional_id' => $validated['professional_id'],
            'patient_id' => $patientId,
            'specialty_id' => $validated['specialty_id'],
            'patient_package_id' => $patientPackageId,
            'start_time' => $validated['start_time'],
            'end_time' => $endTime,
            'status' => 'pendente',
            'notes' => $validated['notes'] ?? null,
        ]);

        return redirect()->back()->with('success', 'Agendamento realizado com sucesso!');
    }

    public function update(Request $request, Appointment $appointment)
    {
        $validated = $request->validate([
            'status'            => 'required|string|in:pendente,confirmado,cancelado,atendido',
            'professional_id'   => 'required|exists:professionals,id',
            'patient_id'        => 'required|exists:patients,id',
            'specialty_id'      => 'required|exists:specialties,id',
            'package_id'        => 'nullable|exists:packages,id',
            'patient_package_id'=> 'nullable|exists:patient_packages,id',
            'start_time'        => 'required|date',
            'notes'             => 'nullable|string',
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

        $hasConflict = Appointment::query()
            ->where('professional_id', $validated['professional_id'])
            ->where('status', '!=', 'cancelado')
            ->where('id', '!=', $appointment->id)
            ->where(function ($query) use ($startTime, $endTime) {
                $query->where('start_time', '=', $startTime)
                    ->orWhere(function ($overlap) use ($startTime, $endTime) {
                        $overlap->whereNotNull('end_time')
                            ->where('start_time', '<', $endTime)
                            ->where('end_time', '>', $startTime);
                    });
            })
            ->exists();

        if ($hasConflict) {
            return redirect()->back()->withErrors([
                'hour' => 'Horário não disponível, escolha outro horário.',
                'start_time' => 'Horário não disponível, escolha outro horário.',
            ]);
        }

        $patientPackageId = $validated['patient_package_id'] ?? null;

        if (!$patientPackageId && !empty($validated['package_id'])) {
            $selectedPackage = Package::findOrFail($validated['package_id']);
            $patient = Patient::findOrFail($validated['patient_id']);

            $existingPatientPackage = $patient->packages()
                ->where('package_id', $selectedPackage->id)
                ->where('status', 'active')
                ->latest()
                ->first();

            if ($existingPatientPackage) {
                $patientPackageId = $existingPatientPackage->id;
            } else {
                $newPatientPackage = $patient->packages()->create([
                    'package_id' => $selectedPackage->id,
                    'start_date' => $startTime->toDateString(),
                    'end_date' => null,
                    'billing_day' => null,
                    'price' => $selectedPackage->price,
                    'session_count' => $selectedPackage->session_count,
                    'status' => 'active',
                    'payment_status' => 'pending',
                    'notes' => 'Plano vinculado automaticamente no agendamento.',
                ]);

                $patientPackageId = $newPatientPackage->id;
            }
        }

        $appointment->update([
            'status' => $validated['status'],
            'professional_id' => $validated['professional_id'],
            'patient_id' => $validated['patient_id'],
            'specialty_id' => $validated['specialty_id'],
            'patient_package_id' => $patientPackageId,
            'start_time' => $validated['start_time'],
            'end_time' => $endTime,
            'notes' => $validated['notes'] ?? null,
        ]);

        return redirect()->back()->with('success', 'Agendamento atualizado com sucesso!');
    }

    public function destroy(Appointment $appointment)
    {
        $appointment->delete();
        return redirect()->back()->with('success', 'Agendamento removido!');
    }
}
