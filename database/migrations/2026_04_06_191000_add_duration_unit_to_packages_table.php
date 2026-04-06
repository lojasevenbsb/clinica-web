<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('packages', function (Blueprint $table) {
            if (!Schema::hasColumn('packages', 'duration_value')) {
                $table->integer('duration_value')->nullable()->after('duration_months');
            }
            if (!Schema::hasColumn('packages', 'duration_unit')) {
                $table->string('duration_unit', 20)->nullable()->after('duration_value');
            }
        });

        // Migra dados antigos (duration_months) para o novo formato valor+unidade.
        DB::statement("
            UPDATE packages
            SET duration_value = duration_months, duration_unit = 'months'
            WHERE duration_months IS NOT NULL
              AND (duration_value IS NULL OR duration_unit IS NULL)
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("
            UPDATE packages
            SET duration_months = duration_value
            WHERE duration_unit = 'months'
              AND duration_value IS NOT NULL
              AND duration_months IS NULL
        ");

        Schema::table('packages', function (Blueprint $table) {
            if (Schema::hasColumn('packages', 'duration_unit')) {
                $table->dropColumn('duration_unit');
            }
            if (Schema::hasColumn('packages', 'duration_value')) {
                $table->dropColumn('duration_value');
            }
        });
    }
};
