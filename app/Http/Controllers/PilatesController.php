<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Package;
use App\Models\Patient;
use App\Models\PatientPackage;
use App\Models\Specialty;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PilatesController extends Controller
{
    public function index(Request $request)
    {
        $pilatesIds = Specialty::whereRaw('LOWER(name) LIKE ?', ['%pilates%'])->pluck('id');

        $query = PatientPackage::with([
            'patient',
            'package.specialty',
            'installments' => fn($q) => $q->orderBy('numero'),
        ])->whereHas('package', fn($q) => $q->whereIn('specialty_id', $pilatesIds));

        if ($request->search) {
            $search = $request->search;
            $query->whereHas('patient', fn($q) => $q->where('name', 'like', "%{$search}%"));
        }

        if ($request->status && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $patientPackages = $query->orderBy('start_date', 'desc')->get()
            ->filter(fn($pp) => $pp->patient !== null && $pp->package !== null)
            ->values();

        $students = $patientPackages->map(function ($pp) use ($pilatesIds) {
            $appointments = Appointment::with('professional')
                ->where('patient_id', $pp->patient_id)
                ->whereIn('specialty_id', $pilatesIds)
                ->orderBy('start_time', 'asc')
                ->get()
                ->map(fn($a) => [
                    'id'           => $a->id,
                    'start_time'   => $a->start_time->format('Y-m-d H:i'),
                    'status'       => $a->status,
                    'professional' => $a->professional?->name,
                ]);

            // Professional: most frequent in this patient's appointments
            $professionalName = collect($appointments)
                ->pluck('professional')
                ->filter()
                ->countBy()
                ->sortDesc()
                ->keys()
                ->first();

            $installments = $pp->installments->map(fn($i) => [
                'id'       => $i->id,
                'numero'   => $i->numero,
                'due_date' => $i->due_date,
                'amount'   => $i->amount,
                'paid'     => $i->paid,
            ]);

            $attended  = $appointments->where('status', 'atendido')->count();
            $scheduled = $appointments->whereNotIn('status', ['cancelado'])->count();

            return [
                'id'             => $pp->id,
                'status'         => $pp->status,
                'start_date'     => $pp->start_date,
                'end_date'       => $pp->end_date,
                'professional'   => $professionalName,
                'price'          => $pp->price,
                'session_count'  => $pp->session_count,
                'patient'        => [
                    'id'    => $pp->patient->id,
                    'name'  => $pp->patient->name,
                    'phone' => $pp->patient->phone,
                    'email' => $pp->patient->email,
                ],
                'package'        => [
                    'id'   => $pp->package->id,
                    'name' => $pp->package->name,
                ],
                'installments'   => $installments,
                'attendance'     => [
                    'attended'  => $attended,
                    'scheduled' => $scheduled,
                    'total'     => $appointments->count(),
                    'list'      => $appointments,
                ],
            ];
        });

        $summary = [
            'total'               => $students->count(),
            'active'              => $students->where('status', 'active')->count(),
            'pending_installments' => $students->sum(fn($s) => collect($s['installments'])->where('paid', false)->count()),
            'attendance_rate'     => $students->sum(fn($s) => $s['attendance']['scheduled']) > 0
                ? round($students->sum(fn($s) => $s['attendance']['attended']) / $students->sum(fn($s) => $s['attendance']['scheduled']) * 100)
                : 0,
        ];

        $pilatesPackages = Package::whereIn('specialty_id', $pilatesIds)
            ->orderBy('name')
            ->get(['id', 'name', 'price', 'session_count', 'specialty_id']);

        $patients = Patient::orderBy('name')
            ->get(['id', 'name', 'phone', 'email', 'cpf']);

        return Inertia::render('Pilates/Index', [
            'students'        => $students,
            'summary'         => $summary,
            'filters'         => $request->only(['search', 'status']),
            'pilatesPackages' => $pilatesPackages,
            'patients'        => $patients,
        ]);
    }
}
