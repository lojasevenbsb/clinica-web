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
        // Cadastro rápido de paciente avulso precisa permitir dados mínimos.
        DB::statement('ALTER TABLE patients MODIFY birth_date DATE NULL');
        DB::statement('ALTER TABLE patients MODIFY cpf VARCHAR(191) NULL');

        Schema::table('patients', function (Blueprint $table) {
            if (!Schema::hasColumn('patients', 'is_walk_in')) {
                $table->boolean('is_walk_in')->default(false)->after('address');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('patients', 'is_walk_in')) {
            Schema::table('patients', function (Blueprint $table) {
                $table->dropColumn('is_walk_in');
            });
        }

        DB::statement("UPDATE patients SET birth_date = '1900-01-01' WHERE birth_date IS NULL");
        DB::statement("UPDATE patients SET cpf = CONCAT('TEMP-', id) WHERE cpf IS NULL OR cpf = ''");
        DB::statement('ALTER TABLE patients MODIFY birth_date DATE NOT NULL');
        DB::statement('ALTER TABLE patients MODIFY cpf VARCHAR(191) NOT NULL');
    }
};
