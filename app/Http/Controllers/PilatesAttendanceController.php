<?php

namespace App\Http\Controllers;

use App\Models\PilatesAttendance;
use App\Models\PilatesEnrollment;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PilatesAttendanceController extends Controller
{
    /**
     * Tela principal: lista todos os alunos ativos com resumo de frequência do mês.
     */
    public function index(Request $request)
    {
        $month = $request->month
            ? Carbon::createFromFormat('Y-m', $request->month)->startOfMonth()
            : Carbon::today()->startOfMonth();

        $monthEnd = $month->copy()->endOfMonth();

        $enrollments = PilatesEnrollment::with(['patient'])
            ->where('status', 'active')
            ->orderBy('created_at')
            ->get();

        $students = $enrollments->map(function ($e) use ($month, $monthEnd) {
            $attendances = PilatesAttendance::where('patient_id', $e->patient_id)
                ->where('pilates_enrollment_id', $e->id)
                ->whereBetween('date', [$month, $monthEnd])
                ->get();

            $presentes  = $attendances->where('status', 'presente')->count();
            $faltas     = $attendances->where('status', 'falta')->count();
            $cancelados = $attendances->where('status', 'cancelado')->count();
            $esperado   = $e->sessions_per_month ?? 0;
            $pct        = $esperado > 0 ? round(($presentes / $esperado) * 100) : null;

            // Última presença registrada (qualquer mês)
            $ultima = PilatesAttendance::where('patient_id', $e->patient_id)
                ->where('status', 'presente')
                ->orderByDesc('date')
                ->value('date');

            return [
                'enrollment_id'    => $e->id,
                'patient_id'       => $e->patient_id,
                'patient_name'     => $e->patient?->name,
                'patient_phone'    => $e->patient?->phone,
                'package_name'     => $e->package?->name ?? null,
                'sessions_per_month' => $e->sessions_per_month,
                'presentes'        => $presentes,
                'faltas'           => $faltas,
                'cancelados'       => $cancelados,
                'esperado'         => $esperado,
                'pct'              => $pct,
                'ultima_presenca'  => $ultima ? Carbon::parse($ultima)->toDateString() : null,
            ];
        })->values();

        return Inertia::render('Pilates/Frequencia', [
            'students'     => $students,
            'month'        => $month->format('Y-m'),
            'month_label'  => $month->translatedFormat('F \d\e Y'),
        ]);
    }

    /**
     * Retorna as presenças de um aluno num mês (para o calendário).
     */
    public function show(Request $request, $enrollmentId)
    {
        $month = $request->month
            ? Carbon::createFromFormat('Y-m', $request->month)->startOfMonth()
            : Carbon::today()->startOfMonth();

        $enrollment = PilatesEnrollment::with('patient')->findOrFail($enrollmentId);

        $attendances = PilatesAttendance::where('pilates_enrollment_id', $enrollmentId)
            ->whereBetween('date', [$month, $month->copy()->endOfMonth()])
            ->get()
            ->keyBy(fn($a) => $a->date->toDateString());

        return response()->json([
            'enrollment' => [
                'id'                 => $enrollment->id,
                'patient_name'       => $enrollment->patient?->name,
                'sessions_per_month' => $enrollment->sessions_per_month,
            ],
            'month'      => $month->format('Y-m'),
            'attendances' => $attendances->map(fn($a) => [
                'id'     => $a->id,
                'date'   => $a->date->toDateString(),
                'status' => $a->status,
                'source' => $a->source,
                'notes'  => $a->notes,
            ])->values(),
        ]);
    }

    /**
     * Registra ou atualiza presença de um dia (toggle via calendário).
     */
    public function upsert(Request $request)
    {
        $request->validate([
            'enrollment_id' => 'required|exists:pilates_enrollments,id',
            'date'          => 'required|date',
            'status'        => 'required|in:presente,falta,cancelado,feriado',
            'notes'         => 'nullable|string|max:500',
        ]);

        $enrollment = PilatesEnrollment::findOrFail($request->enrollment_id);

        $attendance = PilatesAttendance::updateOrCreate(
            [
                'patient_id'            => $enrollment->patient_id,
                'pilates_enrollment_id' => $enrollment->id,
                'date'                  => $request->date,
            ],
            [
                'status' => $request->status,
                'source' => 'manual',
                'notes'  => $request->notes,
            ]
        );

        return response()->json([
            'id'     => $attendance->id,
            'date'   => $attendance->date->toDateString(),
            'status' => $attendance->status,
            'source' => $attendance->source,
            'notes'  => $attendance->notes,
        ]);
    }

    /**
     * Remove o registro de presença de um dia (limpa o dia).
     */
    public function destroy($id)
    {
        PilatesAttendance::findOrFail($id)->delete();
        return response()->json(['ok' => true]);
    }
}
