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
        Schema::create('clinic_hours', function (Blueprint $table) {
            $table->id();
            $table->string('day_of_week'); // segunda, terca, quarta, quinta, sexta, sabado, domingo
            $table->boolean('is_open')->default(true);
            $table->time('open_time')->default('08:00');
            $table->time('close_time')->default('18:00');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('clinic_hours');
    }
};
