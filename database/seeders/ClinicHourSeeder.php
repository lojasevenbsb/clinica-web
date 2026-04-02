<?php

namespace Database\Seeders;

use App\Models\ClinicHour;
use Illuminate\Database\Seeder;

class ClinicHourSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $days = [
            ['day_of_week' => 'Segunda-feira', 'is_open' => true, 'open_time' => '07:00', 'close_time' => '19:00'],
            ['day_of_week' => 'Terça-feira', 'is_open' => true, 'open_time' => '07:00', 'close_time' => '19:00'],
            ['day_of_week' => 'Quarta-feira', 'is_open' => true, 'open_time' => '07:00', 'close_time' => '19:00'],
            ['day_of_week' => 'Quinta-feira', 'is_open' => true, 'open_time' => '07:00', 'close_time' => '19:00'],
            ['day_of_week' => 'Sexta-feira', 'is_open' => true, 'open_time' => '07:00', 'close_time' => '19:00'],
            ['day_of_week' => 'Sábado', 'is_open' => true, 'open_time' => '08:00', 'close_time' => '12:00'],
            ['day_of_week' => 'Domingo', 'is_open' => false, 'open_time' => '08:00', 'close_time' => '12:00'],
        ];

        foreach ($days as $day) {
            ClinicHour::updateOrCreate(
                ['day_of_week' => $day['day_of_week']],
                $day
            );
        }
    }
}
