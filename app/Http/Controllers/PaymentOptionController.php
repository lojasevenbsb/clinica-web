<?php

namespace App\Http\Controllers;

use App\Models\PaymentOption;
use Illuminate\Http\Request;

class PaymentOptionController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'group' => 'required|in:method,type',
            'name'  => 'required|string|max:100',
        ]);

        $option = PaymentOption::create([...$validated, 'active' => true]);

        return response()->json($option);
    }

    public function update(Request $request, PaymentOption $paymentOption)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
        ]);

        $paymentOption->update($validated);

        return response()->json($paymentOption);
    }

    public function destroy(PaymentOption $paymentOption)
    {
        $paymentOption->delete();

        return response()->json(['ok' => true]);
    }

    public function index()
    {
        return response()->json(PaymentOption::where('active', true)->orderBy('group')->orderBy('name')->get());
    }
}
