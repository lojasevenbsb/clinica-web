<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pilates_enrollment_installments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pilates_enrollment_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('numero');
            $table->date('due_date');
            $table->decimal('amount', 10, 2);
            $table->boolean('paid')->default(false);
            $table->date('paid_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pilates_enrollment_installments');
    }
};
