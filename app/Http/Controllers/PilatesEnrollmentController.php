<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Package;
use App\Models\Patient;
use App\Models\PaymentOption;
use App\Models\PilatesEnrollment;
use App\Models\PilatesEnrollmentInstallment;
use App\Models\Professional;
use App\Models\Specialty;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class PilatesEnrollmentController extends Controller
{
    public function index(Request $request)
    {
        $query = PilatesEnrollment::with([
            'patient',
            'package',
            'installments',
            'paymentMethod',
            'paymentType',
        ]);

        if ($request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('enrollment_number', 'like', "%{$search}%")
                  ->orWhere('contract_number', 'like', "%{$search}%")
                  ->orWhereHas('patient', fn($q) => $q->where('name', 'like', "%{$search}%"));
            });
        }

        if ($request->status && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $enrollments = $query->orderBy('created_at', 'desc')->get();

        $pilatesIds      = Specialty::whereRaw('LOWER(name) LIKE ?', ['%pilates%'])->pluck('id');
        $pilatesPackages = Package::whereIn('specialty_id', $pilatesIds)->orderBy('name')->get(['id', 'name', 'price', 'session_count']);
        $patients        = Patient::orderBy('name')->get(['id', 'name', 'phone', 'email', 'cpf']);
        $paymentOptions  = PaymentOption::orderBy('name')->get(['id', 'name', 'group']);
        $professionals   = Professional::orderBy('name')->get(['id', 'name']);

        $nextNumber = PilatesEnrollment::generateEnrollmentNumber();

        $summary = [
            'total'               => $enrollments->count(),
            'active'              => $enrollments->where('status', 'active')->count(),
            'pending_installments' => $enrollments->sum(fn($e) => $e->installments->where('paid', false)->count()),
            'revenue_month'       => $enrollments->where('status', 'active')->sum('price'),
        ];

        return Inertia::render('Pilates/Matriculas/Index', [
            'enrollments'    => $enrollments->map(fn($e) => $this->formatEnrollment($e)),
            'summary'        => $summary,
            'filters'        => $request->only(['search', 'status', 'new_patient_id']),
            'pilatesPackages' => $pilatesPackages,
            'patients'       => $patients,
            'paymentOptions' => $paymentOptions,
            'professionals'  => $professionals,
            'nextNumber'     => $nextNumber,
        ]);
    }

    public function create(Request $request)
    {
        $pilatesIds      = Specialty::whereRaw('LOWER(name) LIKE ?', ['%pilates%'])->pluck('id');
        $pilatesPackages = Package::whereIn('specialty_id', $pilatesIds)->orderBy('name')->get(['id', 'name', 'price', 'session_count']);
        $patients        = Patient::orderBy('name')->get(['id', 'name', 'phone', 'email', 'cpf']);
        $paymentOptions  = PaymentOption::orderBy('name')->get(['id', 'name', 'group']);
        $nextNumber      = PilatesEnrollment::generateEnrollmentNumber();

        $professionals = Professional::orderBy('name')->get(['id', 'name']);

        return Inertia::render('Pilates/Matriculas/Create', [
            'pilatesPackages'      => $pilatesPackages,
            'patients'             => $patients,
            'paymentOptions'       => $paymentOptions,
            'nextNumber'           => $nextNumber,
            'preselectedPatientId' => $request->patient_id,
            'professionals'        => $professionals,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'patient_id'        => 'required|exists:patients,id',
            'package_id'        => 'nullable|exists:packages,id',
            'contract_number'   => 'nullable|string|max:60',
            'start_date'        => 'required|date',
            'end_date'          => 'nullable|date|after_or_equal:start_date',
            'price'             => 'required|numeric|min:0',
            'sessions_per_month' => 'nullable|integer|min:1',
            'payment_method_id' => 'nullable|exists:payment_options,id',
            'payment_type_id'   => 'nullable|exists:payment_options,id',
            'status'            => 'in:active,inactive,cancelled',
            'notes'             => 'nullable|string',
            'installments'      => 'nullable|array',
            'installments.*.numero'   => 'required|integer',
            'installments.*.due_date' => 'required|date',
            'installments.*.amount'   => 'required|numeric|min:0',
            'installments.*.paid'     => 'boolean',
        ]);

        $enrollment = PilatesEnrollment::create([
            'enrollment_number'  => PilatesEnrollment::generateEnrollmentNumber(),
            'patient_id'         => $validated['patient_id'],
            'package_id'         => $validated['package_id'] ?? null,
            'contract_number'    => $validated['contract_number'] ?? null,
            'start_date'         => $validated['start_date'],
            'end_date'           => $validated['end_date'] ?? null,
            'price'              => $validated['price'],
            'sessions_per_month' => $validated['sessions_per_month'] ?? null,
            'payment_method_id'  => $validated['payment_method_id'] ?? null,
            'payment_type_id'    => $validated['payment_type_id'] ?? null,
            'status'             => $validated['status'] ?? 'active',
            'notes'              => $validated['notes'] ?? null,
        ]);

        if (!empty($validated['installments'])) {
            foreach ($validated['installments'] as $inst) {
                $enrollment->installments()->create([
                    'numero'   => $inst['numero'],
                    'due_date' => $inst['due_date'],
                    'amount'   => $inst['amount'],
                    'paid'     => $inst['paid'] ?? false,
                    'paid_at'  => ($inst['paid'] ?? false) ? now()->toDateString() : null,
                ]);
            }
        }

        return response()->json($this->formatEnrollment($enrollment->load(['patient', 'package', 'installments', 'paymentMethod', 'paymentType'])));
    }

    public function update(Request $request, PilatesEnrollment $enrollment)
    {
        $validated = $request->validate([
            'contract_number'    => 'nullable|string|max:60',
            'package_id'         => 'nullable|exists:packages,id',
            'start_date'         => 'required|date',
            'end_date'           => 'nullable|date|after_or_equal:start_date',
            'price'              => 'required|numeric|min:0',
            'sessions_per_month' => 'nullable|integer|min:1',
            'payment_method_id'  => 'nullable|exists:payment_options,id',
            'payment_type_id'    => 'nullable|exists:payment_options,id',
            'status'             => 'required|in:active,inactive,cancelled',
            'notes'              => 'nullable|string',
            'installments'       => 'nullable|array',
            'installments.*.numero'   => 'required|integer',
            'installments.*.due_date' => 'required|date',
            'installments.*.amount'   => 'required|numeric|min:0',
            'installments.*.paid'     => 'boolean',
        ]);

        $enrollment->update(\Illuminate\Support\Arr::except($validated, ['installments']));

        if (array_key_exists('installments', $validated)) {
            // Remove only unpaid installments and replace with new ones
            $enrollment->installments()->where('paid', false)->delete();
            foreach ($validated['installments'] as $inst) {
                $enrollment->installments()->create([
                    'numero'   => $inst['numero'],
                    'due_date' => $inst['due_date'],
                    'amount'   => $inst['amount'],
                    'paid'     => $inst['paid'] ?? false,
                    'paid_at'  => ($inst['paid'] ?? false) ? now()->toDateString() : null,
                ]);
            }
        }

        return response()->json($this->formatEnrollment($enrollment->fresh()->load(['patient', 'package', 'installments', 'paymentMethod', 'paymentType'])));
    }

    public function destroy(PilatesEnrollment $enrollment)
    {
        $enrollment->delete();
        return response()->json(['ok' => true]);
    }

    public function schedule(Request $request, PilatesEnrollment $enrollment)
    {
        $validated = $request->validate([
            'slots'                => 'required|array|min:1',
            'slots.*.day_of_week' => 'required|integer|between:0,6',
            'slots.*.start_time'  => 'required|string|regex:/^\d{2}:\d{2}$/',
            'slots.*.duration'    => 'nullable|integer|min:15|max:240',
            'professional_id'     => 'nullable|exists:professionals,id',
        ]);

        $enrollment->loadMissing('package');
        $specialtyId = $enrollment->package?->specialty_id
            ?? Specialty::whereRaw('LOWER(name) LIKE ?', ['%pilates%'])->value('id');

        if (!$specialtyId) {
            return response()->json([
                'message' => 'Nao foi possivel identificar a especialidade de Pilates para gerar os agendamentos.',
            ], 422);
        }

        // Usa o profissional escolhido ou busca automaticamente pela especialidade
        if (!empty($validated['professional_id'])) {
            $professionalId = $validated['professional_id'];
        } else {
            $professionalId = Professional::whereHas('specialties', function ($q) use ($specialtyId) {
                $q->where('specialties.id', $specialtyId);
            })->orderBy('id')->value('id');

            if (!$professionalId) {
                return response()->json([
                    'message' => 'Nao existe profissional vinculado a especialidade selecionada.',
                ], 422);
            }
        }

        $startDate = $enrollment->start_date ?? Carbon::today();
        $endDate   = $enrollment->end_date   ?? $startDate->copy()->addMonth();

        // 1. Pré-calcula todos os slots e verifica conflitos antes de criar qualquer agendamento
        $toCreate   = [];
        $conflicts  = [];

        foreach ($validated['slots'] as $slot) {
            $dayOfWeek = (int) $slot['day_of_week'];
            $duration  = (int) ($slot['duration'] ?? 60);

            $current = $startDate->copy();
            while ($current->dayOfWeek !== $dayOfWeek) {
                $current->addDay();
            }

            while ($current->lte($endDate)) {
                [$h, $m] = explode(':', $slot['start_time']);
                $startDt = $current->copy()->setTime((int)$h, (int)$m);
                $endDt   = $startDt->copy()->addMinutes($duration);

                // Verifica sobreposição: outro agendamento do profissional que não seja cancelado
                $conflict = Appointment::where('professional_id', $professionalId)
                    ->whereNotIn('status', ['cancelado', 'cancelled'])
                    ->where('start_time', '<', $endDt)
                    ->where('end_time',   '>', $startDt)
                    ->first();

                if ($conflict) {
                    $conflicts[] = [
                        'data'   => $startDt->translatedFormat('D, d/m/Y'),
                        'inicio' => $startDt->format('H:i'),
                        'fim'    => $endDt->format('H:i'),
                    ];
                } else {
                    $toCreate[] = [
                        'start' => $startDt,
                        'end'   => $endDt,
                    ];
                }

                $current->addWeek();
            }
        }

        // 2. Se houver qualquer conflito, retorna erro com a lista de datas bloqueadas
        if (!empty($conflicts)) {
            $profissional = Professional::find($professionalId);
            $nome = $profissional?->name ?? 'O profissional';

            $linhas = array_map(
                fn($c) => "{$c['data']} das {$c['inicio']} às {$c['fim']}",
                array_slice($conflicts, 0, 5)
            );

            $extra = count($conflicts) > 5 ? ' (e mais ' . (count($conflicts) - 5) . ' conflito(s))' : '';

            return response()->json([
                'message'   => "{$nome} não tem disponibilidade nos seguintes horários:\n" . implode("\n", $linhas) . $extra,
                'conflicts' => $conflicts,
            ], 422);
        }

        // 3. Nenhum conflito — cria todos os agendamentos
        $created = 0;
        foreach ($toCreate as $slot) {
            Appointment::create([
                'professional_id' => $professionalId,
                'patient_id'      => $enrollment->patient_id,
                'specialty_id'    => $specialtyId,
                'start_time'      => $slot['start'],
                'end_time'        => $slot['end'],
                'status'          => 'pendente',
                'notes'           => 'Pilates - Mat. ' . $enrollment->enrollment_number,
            ]);
            $created++;
        }

        return response()->json(['created' => $created]);
    }

    public function appointments(PilatesEnrollment $enrollment)
    {
        $appointments = Appointment::where('patient_id', $enrollment->patient_id)
            ->where('notes', 'like', '%Mat. ' . $enrollment->enrollment_number . '%')
            ->orderBy('start_time')
            ->get(['id', 'start_time', 'end_time', 'status']);

        return response()->json($appointments->map(fn($a) => [
            'id'         => $a->id,
            'start_time' => $a->start_time?->toDateTimeString(),
            'end_time'   => $a->end_time?->toDateTimeString(),
            'status'     => $a->status,
        ]));
    }

    public function toggleInstallment(PilatesEnrollmentInstallment $installment)
    {
        $installment->paid   = !$installment->paid;
        $installment->paid_at = $installment->paid ? now()->toDateString() : null;
        $installment->save();

        return response()->json(['paid' => $installment->paid, 'paid_at' => $installment->paid_at]);
    }

    public function dashboard()
    {
        $today     = Carbon::today();
        $monthStart = $today->copy()->startOfMonth();
        $monthEnd   = $today->copy()->endOfMonth();

        $all = PilatesEnrollment::with(['patient', 'package', 'installments', 'paymentMethod'])->get();

        // KPIs
        $ativos       = $all->where('status', 'active');
        $receitaMes   = PilatesEnrollmentInstallment::whereBetween('paid_at', [$monthStart, $monthEnd])->where('paid', true)->sum('amount');
        $aReceberMes  = PilatesEnrollmentInstallment::whereBetween('due_date', [$monthStart, $monthEnd])->where('paid', false)->sum('amount');
        $inadimplentes = $all->filter(fn($e) =>
            $e->installments->where('paid', false)->filter(fn($i) => $i->due_date && $i->due_date < $today)->count() > 0
        );

        // Vencendo este mês (end_date no mês corrente)
        $vencendoMes = $all->filter(fn($e) =>
            $e->end_date && $e->end_date->between($monthStart, $monthEnd) && $e->status === 'active'
        )->map(fn($e) => [
            'id'       => $e->id,
            'patient'  => $e->patient?->name,
            'package'  => $e->package?->name,
            'end_date' => $e->end_date->toDateString(),
            'price'    => $e->price,
        ])->values();

        // Parcelas em atraso
        $atrasadas = PilatesEnrollmentInstallment::with('enrollment.patient')
            ->where('paid', false)
            ->where('due_date', '<', $today)
            ->orderBy('due_date')
            ->get()
            ->map(fn($i) => [
                'id'        => $i->id,
                'patient'   => $i->enrollment?->patient?->name,
                'due_date'  => $i->due_date->toDateString(),
                'amount'    => $i->amount,
                'dias_atraso' => $i->due_date->diffInDays($today),
            ]);

        // Distribuição por plano
        $porPlano = $ativos->groupBy(fn($e) => $e->package?->name ?? 'Sem plano')
            ->map(fn($g, $name) => ['name' => $name, 'count' => $g->count()])
            ->values();

        // Receita paga por mês (últimos 6 meses)
        $receitaMeses = collect();
        for ($i = 5; $i >= 0; $i--) {
            $mes = $today->copy()->subMonths($i);
            $pago = PilatesEnrollmentInstallment::whereYear('paid_at', $mes->year)
                ->whereMonth('paid_at', $mes->month)
                ->where('paid', true)
                ->sum('amount');
            $receitaMeses->push([
                'mes'   => $mes->translatedFormat('M/y'),
                'valor' => (float) $pago,
            ]);
        }

        // Novas matrículas por mês (últimos 6 meses)
        $novasMeses = collect();
        for ($i = 5; $i >= 0; $i--) {
            $mes = $today->copy()->subMonths($i);
            $count = PilatesEnrollment::whereYear('created_at', $mes->year)
                ->whereMonth('created_at', $mes->month)
                ->count();
            $novasMeses->push([
                'mes'   => $mes->translatedFormat('M/y'),
                'count' => $count,
            ]);
        }

        // Lista rápida de alunos ativos
        $alunosAtivos = $ativos->map(fn($e) => [
            'id'              => $e->id,
            'patient'         => $e->patient?->name,
            'phone'           => $e->patient?->phone,
            'package'         => $e->package?->name,
            'price'           => $e->price,
            'end_date'        => $e->end_date?->toDateString(),
            'payment_method'  => $e->paymentMethod?->name,
            'proxima_parcela' => $e->installments
                ->where('paid', false)
                ->filter(fn($i) => $i->due_date >= $today)
                ->sortBy('due_date')
                ->first()?->due_date?->toDateString(),
            'parcelas_atraso' => $e->installments->where('paid', false)
                ->filter(fn($i) => $i->due_date && $i->due_date < $today)->count(),
        ])->sortBy('patient')->values();

        return Inertia::render('Pilates/Dashboard', [
            'kpis' => [
                'ativos'        => $ativos->count(),
                'receita_mes'   => (float) $receitaMes,
                'a_receber_mes' => (float) $aReceberMes,
                'inadimplentes' => $inadimplentes->count(),
                'vencendo_mes'  => $vencendoMes->count(),
                'novos_mes'     => PilatesEnrollment::whereMonth('created_at', $today->month)->whereYear('created_at', $today->year)->count(),
            ],
            'vencendo_mes'  => $vencendoMes,
            'atrasadas'     => $atrasadas,
            'por_plano'     => $porPlano,
            'receita_meses' => $receitaMeses,
            'novas_meses'   => $novasMeses,
            'alunos_ativos' => $alunosAtivos,
        ]);
    }

    private function formatEnrollment(PilatesEnrollment $e): array
    {
        return [
            'id'                 => $e->id,
            'enrollment_number'  => $e->enrollment_number,
            'contract_number'    => $e->contract_number,
            'start_date'         => $e->start_date?->toDateString(),
            'end_date'           => $e->end_date?->toDateString(),
            'price'              => $e->price,
            'sessions_per_month' => $e->sessions_per_month,
            'status'             => $e->status,
            'notes'              => $e->notes,
            'payment_method'     => $e->paymentMethod?->name,
            'payment_type'       => $e->paymentType?->name,
            'payment_method_id'  => $e->payment_method_id,
            'payment_type_id'    => $e->payment_type_id,
            'patient'            => $e->patient ? ['id' => $e->patient->id, 'name' => $e->patient->name, 'phone' => $e->patient->phone, 'email' => $e->patient->email] : null,
            'package'            => $e->package ? ['id' => $e->package->id, 'name' => $e->package->name] : null,
            'installments'       => $e->installments->map(fn($i) => [
                'id'       => $i->id,
                'numero'   => $i->numero,
                'due_date' => $i->due_date?->toDateString(),
                'amount'   => $i->amount,
                'paid'     => $i->paid,
                'paid_at'  => $i->paid_at?->toDateString(),
            ])->values()->all(),
        ];
    }
}
