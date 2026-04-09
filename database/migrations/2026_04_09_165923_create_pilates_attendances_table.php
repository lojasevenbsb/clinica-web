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
        Schema::create('pilates_attendances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained()->cascadeOnDelete();
            $table->foreignId('pilates_enrollment_id')->nullable()->constrained()->nullOnDelete();
            $table->date('date');
            // presente | falta | cancelado | feriado
            $table->enum('status', ['presente', 'falta', 'cancelado', 'feriado'])->default('presente');
            // manual | agendamento | facial  (preparado para reconhecimento facial futuro)
            $table->enum('source', ['manual', 'agendamento', 'facial'])->default('manual');
            $table->foreignId('appointment_id')->nullable()->constrained()->nullOnDelete();
            // Campos reservados para reconhecimento facial
            $table->decimal('facial_confidence', 5, 2)->nullable();
            $table->string('facial_image_path')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['patient_id', 'date', 'pilates_enrollment_id']);
            $table->index(['patient_id', 'date']);
            $table->index(['pilates_enrollment_id', 'date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pilates_attendances');
    }
};
