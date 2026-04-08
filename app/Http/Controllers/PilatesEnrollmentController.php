<?php

namespace App\Http\Controllers;

use App\Models\Package;
use App\Models\Patient;
use App\Models\PaymentOption;
use App\Models\PilatesEnrollment;
use App\Models\PilatesEnrollmentInstallment;
use App\Models\Specialty;
use Illuminate\Http\Request;
use Inertia\Inertia;

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
            'filters'        => $request->only(['search', 'status']),
            'pilatesPackages' => $pilatesPackages,
            'patients'       => $patients,
            'paymentOptions' => $paymentOptions,
            'nextNumber'     => $nextNumber,
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
            'start_date'         => 'required|date',
            'end_date'           => 'nullable|date|after_or_equal:start_date',
            'price'              => 'required|numeric|min:0',
            'sessions_per_month' => 'nullable|integer|min:1',
            'payment_method_id'  => 'nullable|exists:payment_options,id',
            'payment_type_id'    => 'nullable|exists:payment_options,id',
            'status'             => 'required|in:active,inactive,cancelled',
            'notes'              => 'nullable|string',
        ]);

        $enrollment->update($validated);

        return response()->json($this->formatEnrollment($enrollment->fresh()->load(['patient', 'package', 'installments', 'paymentMethod', 'paymentType'])));
    }

    public function destroy(PilatesEnrollment $enrollment)
    {
        $enrollment->delete();
        return response()->json(['ok' => true]);
    }

    public function toggleInstallment(PilatesEnrollmentInstallment $installment)
    {
        $installment->paid   = !$installment->paid;
        $installment->paid_at = $installment->paid ? now()->toDateString() : null;
        $installment->save();

        return response()->json(['paid' => $installment->paid, 'paid_at' => $installment->paid_at]);
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
