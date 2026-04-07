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
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;

class AgendaController extends Controller
{
    public function index(Request $request)
    {
        $date = $request->date ? Carbon::parse($request->date) : Carbon::today();
        $professionalId = $request->professional_id;
        $view = $request->view ?? 'week';

        $professionals = Professional::with(['hours', 'specialties'])->get();

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
                    'nickname'  => $prof->nickname,
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

        // Attach sibling repeat appointments for appointments that belong to a group
        $groupIds = $appointments->pluck('repeat_group_id')->filter()->unique()->values();
        if ($groupIds->isNotEmpty()) {
            $siblings = Appointment::whereIn('repeat_group_id', $groupIds)
                ->orderBy('start_time')
                ->get(['id', 'repeat_group_id', 'start_time', 'status'])
                ->groupBy('repeat_group_id');

            $appointments->each(function ($appt) use ($siblings) {
                if ($appt->repeat_group_id) {
                    $appt->repeat_siblings = $siblings->get($appt->repeat_group_id, collect())
                        ->map(fn ($s) => [
                            'id'         => $s->id,
                            'start_time' => $s->start_time,
                            'status'     => $s->status,
                        ])->values();
                } else {
                    $appt->repeat_siblings = [];
                }
            });
        }

        // For the "all" mode or month view, send the full month's appointments for the calendar
        $monthAppointments = [];
        if ($professionalId === 'all' || $view === 'month') {
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
            'specialties' => Specialty::with('subgroups')->orderBy('name')->get(),
            'appointments' => $appointments,
            'monthAppointments' => $monthAppointments,
            'professionalHours' => $hours,
            'filters' => [
                'date' => $date->format('Y-m-d'),
                'professional_id' => $professionalId,
                'view' => $view,
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
            'specialty_id'          => 'required|exists:specialties,id',
            'specialty_subgroup_id' => 'nullable|exists:specialty_subgroups,id',
            'package_id'            => 'nullable|exists:packages,id',
            'patient_package_id'    => 'nullable|exists:patient_packages,id',
            'start_time'            => 'required|date',
            'notes'                 => 'nullable|string',
            'repeat_days'           => 'nullable|array',
            'repeat_days.*'         => 'integer|between:1,7',
            'repeat_weeks'          => 'nullable|integer|min:1|max:52',
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
        $subgroup = $request->specialty_subgroup_id
            ? \App\Models\SpecialtySubgroup::find($request->specialty_subgroup_id)
            : null;
        $durationMinutes = ($subgroup?->duration_minutes) ?: ($specialty->duration_minutes ?: 30);

        $repeatDays = collect($validated['repeat_days'] ?? [])
            ->map(fn ($day) => (int) $day)
            ->filter(fn ($day) => $day >= 1 && $day <= 7)
            ->unique()
            ->sort()
            ->values();
        $repeatWeeks = (int) ($validated['repeat_weeks'] ?? 1);

        $occurrenceStarts = collect([$startTime->copy()]);
        if ($repeatDays->isNotEmpty()) {
            $occurrenceStarts = collect();

            foreach ($repeatDays as $repeatDay) {
                // Find first occurrence of this weekday on or after $startTime
                $first = $startTime->copy()->startOfDay();
                $currentDow = (int) $first->format('N'); // 1=Mon ... 7=Sun
                $daysToAdd = ($repeatDay - $currentDow + 7) % 7;
                $first->addDays($daysToAdd)->setTime($startTime->hour, $startTime->minute, 0);

                // Generate $repeatWeeks occurrences spaced 1 week apart
                for ($w = 0; $w < $repeatWeeks; $w++) {
                    $occurrenceStarts->push($first->copy()->addWeeks($w));
                }
            }
        }

        $occurrenceStarts = $occurrenceStarts
            ->sortBy(fn (Carbon $date) => $date->getTimestamp())
            ->values();

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

        $professional = Professional::findOrFail($request->professional_id);

        foreach ($occurrenceStarts as $occurrenceStart) {
            $dayName = $daysTranslations[$occurrenceStart->format('l')];
            $hourConfig = $professional->hours()->where('day_of_week', $dayName)->first();

            if (!$hourConfig || !$hourConfig->is_open) {
                return redirect()->back()->withErrors([
                    'start_time' => "O profissional não atende no dia {$occurrenceStart->format('d/m/Y')} ({$dayName}).",
                ]);
            }

            $occurrenceEnd = $occurrenceStart->copy()->addMinutes($durationMinutes);
            $openTime = Carbon::createFromFormat('H:i:s', $hourConfig->open_time)->setDateFrom($occurrenceStart);
            $closeTime = Carbon::createFromFormat('H:i:s', $hourConfig->close_time)->setDateFrom($occurrenceStart);

            if ($occurrenceStart->lt($openTime) || $occurrenceEnd->gt($closeTime)) {
                return redirect()->back()->withErrors([
                    'start_time' => "Horário fora do expediente no dia {$occurrenceStart->format('d/m/Y')}. Atendimento: {$openTime->format('H:i')} às {$closeTime->format('H:i')}.",
                ]);
            }

            $minutesFromOpening = $openTime->diffInMinutes($occurrenceStart);
            if ($minutesFromOpening % 30 !== 0) {
                return redirect()->back()->withErrors([
                    'hour' => "Hora de início inválida para {$occurrenceStart->format('d/m/Y')}. Use intervalos de 30 minutos a partir de {$openTime->format('H:i')}.",
                    'start_time' => "Hora de início inválida para {$occurrenceStart->format('d/m/Y')}. Use intervalos de 30 minutos a partir de {$openTime->format('H:i')}.",
                ]);
            }
        }

        // Capacity check
        $effectiveCapacity = $subgroup?->capacity ?? $specialty->capacity;
        if ($effectiveCapacity) {
            foreach ($occurrenceStarts as $occurrenceStart) {
                $occurrenceEnd = $occurrenceStart->copy()->addMinutes($durationMinutes);

                $query = Appointment::where('specialty_id', $specialty->id)
                    ->whereNotIn('status', ['cancelado'])
                    ->where('start_time', '<', $occurrenceEnd)
                    ->whereRaw("COALESCE(end_time, DATE_ADD(start_time, INTERVAL 30 MINUTE)) > ?", [$occurrenceStart]);

                if ($subgroup) {
                    $query->where('specialty_subgroup_id', $subgroup->id);
                }

                $occupied = $query->count();

                if ($occupied >= $effectiveCapacity) {
                    $label = $subgroup ? "{$specialty->name} – {$subgroup->name}" : $specialty->name;
                    return redirect()->back()->withErrors([
                        'start_time' => "Capacidade máxima atingida para {$label} no horário {$occurrenceStart->format('d/m/Y H:i')} ({$effectiveCapacity} vaga(s)).",
                    ]);
                }
            }
        }

        $patient = Patient::findOrFail($patientId);

        $createdCount = DB::transaction(function () use ($validated, $patient, $patientId, $startTime, $durationMinutes, $occurrenceStarts) {
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

            $repeatGroupId = $occurrenceStarts->count() > 1 ? Str::uuid()->toString() : null;

            foreach ($occurrenceStarts as $occurrenceStart) {
                Appointment::create([
                    'professional_id'       => $validated['professional_id'],
                    'patient_id'            => $patientId,
                    'specialty_id'          => $validated['specialty_id'],
                    'specialty_subgroup_id' => $validated['specialty_subgroup_id'] ?? null,
                    'patient_package_id'    => $patientPackageId,
                    'start_time'            => $occurrenceStart->toDateTimeString(),
                    'end_time'              => $occurrenceStart->copy()->addMinutes($durationMinutes)->toDateTimeString(),
                    'status'                => 'pendente',
                    'notes'                 => $validated['notes'] ?? null,
                    'repeat_group_id'       => $repeatGroupId,
                ]);
            }

            return $occurrenceStarts->count();
        });

        $successMessage = $createdCount > 1
            ? "{$createdCount} agendamentos realizados com sucesso!"
            : 'Agendamento realizado com sucesso!';

        return redirect()->back()->with('success', $successMessage);
    }

    public function update(Request $request, Appointment $appointment)
    {
        $validated = $request->validate([
            'status'                => 'required|string|in:pendente,confirmado,cancelado,atendido',
            'professional_id'       => 'required|exists:professionals,id',
            'patient_id'            => 'required|exists:patients,id',
            'specialty_id'          => 'required|exists:specialties,id',
            'specialty_subgroup_id' => 'nullable|exists:specialty_subgroups,id',
            'package_id'            => 'nullable|exists:packages,id',
            'patient_package_id'    => 'nullable|exists:patient_packages,id',
            'start_time'            => 'required|date',
            'notes'                 => 'nullable|string',
        ]);

        $startTime = Carbon::parse($request->start_time);
        $specialty = Specialty::findOrFail($request->specialty_id);
        $subgroup = $request->specialty_subgroup_id
            ? \App\Models\SpecialtySubgroup::find($request->specialty_subgroup_id)
            : null;
        $durationMinutes = ($subgroup?->duration_minutes) ?: ($specialty->duration_minutes ?: 30);
        $endTime = $startTime->copy()->addMinutes($durationMinutes);

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

        $minutesFromOpening = $openTime->diffInMinutes($startTime);
        if ($minutesFromOpening % 30 !== 0) {
            return redirect()->back()->withErrors([
                'hour' => "Hora de início inválida para a agenda do profissional. Use intervalos de 30 minutos a partir de {$openTime->format('H:i')}.",
                'start_time' => "Hora de início inválida para a agenda do profissional. Use intervalos de 30 minutos a partir de {$openTime->format('H:i')}.",
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
            'status'                => $validated['status'],
            'professional_id'       => $validated['professional_id'],
            'patient_id'            => $validated['patient_id'],
            'specialty_id'          => $validated['specialty_id'],
            'specialty_subgroup_id' => $validated['specialty_subgroup_id'] ?? null,
            'patient_package_id'    => $patientPackageId,
            'start_time'            => $validated['start_time'],
            'end_time'              => $endTime,
            'notes'                 => $validated['notes'] ?? null,
        ]);

        return redirect()->back()->with('success', 'Agendamento atualizado com sucesso!');
    }

    public function destroy(Appointment $appointment)
    {
        $appointment->delete();
        return redirect()->back()->with('success', 'Agendamento removido!');
    }

    public function patientAppointments(Patient $patient)
    {
        $appointments = Appointment::with(['specialty', 'professional', 'patientPackage.package'])
            ->where('patient_id', $patient->id)
            ->orderBy('start_time', 'desc')
            ->get()
            ->map(function ($a) {
                return [
                    'id'           => $a->id,
                    'start_time'   => $a->start_time->format('Y-m-d H:i'),
                    'end_time'     => $a->end_time ? $a->end_time->format('Y-m-d H:i') : null,
                    'status'       => $a->status,
                    'notes'        => $a->notes,
                    'specialty'    => $a->specialty ? $a->specialty->name : null,
                    'professional' => $a->professional ? $a->professional->name : null,
                    'package'      => $a->patientPackage && $a->patientPackage->package ? $a->patientPackage->package->name : null,
                ];
            });

        return response()->json($appointments);
    }
}
