<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('professional_hours', function (Blueprint $table) {
            $table->boolean('has_second_period')->default(false)->after('close_time');
            $table->time('open_time_2')->nullable()->after('has_second_period');
            $table->time('close_time_2')->nullable()->after('open_time_2');
        });
    }

    public function down(): void
    {
        Schema::table('professional_hours', function (Blueprint $table) {
            $table->dropColumn(['has_second_period', 'open_time_2', 'close_time_2']);
        });
    }
};
