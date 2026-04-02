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
        Schema::table('clinic_hours', function (Blueprint $table) {
            $table->time('lunch_start')->nullable()->after('close_time');
            $table->time('lunch_end')->nullable()->after('lunch_start');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('clinic_hours', function (Blueprint $table) {
            $table->dropColumn(['lunch_start', 'lunch_end']);
        });
    }
};
