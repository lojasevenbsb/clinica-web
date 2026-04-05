<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('patient_package_installments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_package_id')->constrained()->cascadeOnDelete();
            $table->integer('numero');
            $table->date('due_date');
            $table->decimal('amount', 10, 2);
            $table->boolean('paid')->default(false);
            $table->timestamps();
        });

        Schema::table('patient_packages', function (Blueprint $table) {
            $table->string('payment_status')->default('pending')->after('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('patient_package_installments');
        Schema::table('patient_packages', function (Blueprint $table) {
            $table->dropColumn('payment_status');
        });
    }
};
