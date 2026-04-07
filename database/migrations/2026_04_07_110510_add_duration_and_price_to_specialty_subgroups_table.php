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
        Schema::table('specialty_subgroups', function (Blueprint $table) {
            $table->integer('duration_minutes')->nullable()->after('name');
            $table->decimal('price', 10, 2)->nullable()->after('duration_minutes');
        });
    }

    public function down(): void
    {
        Schema::table('specialty_subgroups', function (Blueprint $table) {
            $table->dropColumn(['duration_minutes', 'price']);
        });
    }
};
