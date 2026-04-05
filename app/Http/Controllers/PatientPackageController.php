<?php

namespace App\Http\Controllers;

use App\Models\Patient;
use App\Models\PatientPackage;
use App\Models\PatientPackageInstallment;
use App\Models\PaymentOption;
use App\Models\Specialty;
use Illuminate\Http\Request;

class PatientPackageController extends Controller
{
    public function index(Patient $patient)
    {
        $paymentOptions = PaymentOption::all()->keyBy('id');

        $plans = $patient->packages()->with('package.specialty', 'installments')->latest()->get()
            ->map(function ($pp) use ($paymentOptions) {
                $arr = $pp->toArray();
                $arr['payment_method_name'] = $pp->payment_method ? ($paymentOptions->get($pp->payment_method)?->name ?? $pp->payment_method) : null;
                $arr['payment_type_name']   = $pp->payment_type   ? ($paymentOptions->get($pp->payment_type)?->name   ?? $pp->payment_type)   : null;
                return $arr;
            });

        return response()->json($plans);
    }

    public function store(Request $request, Patient $patient)
    {
        $validated = $request->validate([
            'package_id'     => 'required|exists:packages,id',
            'start_date'     => 'required|date',
            'price'          => 'required|numeric|min:0',
            'session_count'  => 'nullable|integer|min:1',
            'payment_type'   => 'nullable|string',
            'payment_method' => 'nullable|string',
            'notes'          => 'nullable|string',
            'installments'   => 'nullable|array',
            'installments.*.numero'   => 'required|integer',
            'installments.*.due_date' => 'required|date',
            'installments.*.amount'   => 'required|numeric|min:0',
            'installments.*.paid'     => 'boolean',
        ]);

        $patientPackage = $patient->packages()->create(array_merge(
            collect($validated)->except('installments')->toArray(),
            ['status' => 'active']
        ));

        if (!empty($validated['installments'])) {
            foreach ($validated['installments'] as $inst) {
                $patientPackage->installments()->create([
                    'numero'   => $inst['numero'],
                    'due_date' => $inst['due_date'],
                    'amount'   => $inst['amount'],
                    'paid'     => $inst['paid'] ?? false,
                ]);
            }
        }

        return response()->json(['success' => true]);
    }

    public function update(Request $request, PatientPackage $patientPackage)
    {
        $validated = $request->validate([
            'price'          => 'required|numeric|min:0',
            'session_count'  => 'nullable|integer|min:1',
            'start_date'     => 'required|date',
            'payment_type'   => 'nullable|string',
            'payment_method' => 'nullable|string',
            'payment_status' => 'nullable|string',
            'status'         => 'nullable|string',
            'notes'          => 'nullable|string',
        ]);

        $patientPackage->update($validated);

        $paymentOptions = PaymentOption::all()->keyBy('id');
        $arr = $patientPackage->fresh()->load('package.specialty', 'installments')->toArray();
        $arr['payment_method_name'] = $patientPackage->payment_method ? ($paymentOptions->get($patientPackage->payment_method)?->name ?? $patientPackage->payment_method) : null;
        $arr['payment_type_name']   = $patientPackage->payment_type   ? ($paymentOptions->get($patientPackage->payment_type)?->name   ?? $patientPackage->payment_type)   : null;

        return response()->json($arr);
    }

    public function toggleInstallment(PatientPackageInstallment $installment)
    {
        $installment->update(['paid' => !$installment->paid]);
        return response()->json($installment->fresh());
    }

    public function specialties()
    {
        return Specialty::with('packages')->orderBy('name')->get();
    }
}
