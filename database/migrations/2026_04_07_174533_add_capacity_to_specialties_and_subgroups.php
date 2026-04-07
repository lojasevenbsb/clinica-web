<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('specialties', function (Blueprint $table) {
            $table->unsignedSmallInteger('capacity')->nullable()->after('duration_minutes');
        });

        Schema::table('specialty_subgroups', function (Blueprint $table) {
            $table->unsignedSmallInteger('capacity')->nullable()->after('duration_minutes');
        });
    }

    public function down(): void
    {
        Schema::table('specialties', function (Blueprint $table) {
            $table->dropColumn('capacity');
        });

        Schema::table('specialty_subgroups', function (Blueprint $table) {
            $table->dropColumn('capacity');
        });
    }
};
