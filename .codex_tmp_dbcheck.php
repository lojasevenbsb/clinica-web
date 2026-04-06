<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo 'patients:' . App\Models\Patient::count() . PHP_EOL;
echo 'patient_packages:' . App\Models\PatientPackage::count() . PHP_EOL;
echo 'packages:' . App\Models\Package::count() . PHP_EOL;
