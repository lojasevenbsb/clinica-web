<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

use App\Models\Specialty;

class SpecialtySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $specialties = [
            'Fisioterapia',
            'Pilates',
            'Osteopatia',
            'RPG',
            'Acupuntura',
            'Nutrição',
            'Psicologia',
            'Quiropraxia',
        ];

        foreach ($specialties as $name) {
            Specialty::firstOrCreate(['name' => $name]);
        }
    }
}
