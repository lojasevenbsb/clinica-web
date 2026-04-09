<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ProfessionalController;
use App\Http\Controllers\PatientController;
use App\Http\Controllers\SpecialtyController;
use App\Http\Controllers\AgendaController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\PatientPackageController;
use App\Http\Controllers\PaymentOptionController;
use App\Http\Controllers\PilatesController;
use App\Http\Controllers\PilatesEnrollmentController;
use App\Http\Controllers\PilatesAttendanceController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', function () {
        return Inertia::render('Dashboard');
    })->name('dashboard');

    Route::get('/agenda', [AgendaController::class, 'index'])->name('agenda');
    Route::get('/pilates', [PilatesController::class, 'index'])->name('pilates.index');
    Route::get('/pilates/dashboard', [PilatesEnrollmentController::class, 'dashboard'])->name('pilates.dashboard');
    Route::get('/pilates/frequencia', [PilatesAttendanceController::class, 'index'])->name('pilates.frequencia');
    Route::get('/pilates/frequencia/{enrollment}', [PilatesAttendanceController::class, 'show'])->name('pilates.frequencia.show');
    Route::post('/pilates/frequencia/upsert', [PilatesAttendanceController::class, 'upsert'])->name('pilates.frequencia.upsert');
    Route::delete('/pilates/frequencia/{attendance}', [PilatesAttendanceController::class, 'destroy'])->name('pilates.frequencia.destroy');
    Route::get('/pilates/matriculas', [PilatesEnrollmentController::class, 'index'])->name('pilates.matriculas.index');
    Route::post('/pilates/matriculas', [PilatesEnrollmentController::class, 'store'])->name('pilates.matriculas.store');
    Route::put('/pilates/matriculas/{enrollment}', [PilatesEnrollmentController::class, 'update'])->name('pilates.matriculas.update');
    Route::delete('/pilates/matriculas/{enrollment}', [PilatesEnrollmentController::class, 'destroy'])->name('pilates.matriculas.destroy');
    Route::patch('/pilates/matriculas/installments/{installment}/toggle', [PilatesEnrollmentController::class, 'toggleInstallment'])->name('pilates.matriculas.installments.toggle');
    Route::post('/pilates/matriculas/{enrollment}/schedule', [PilatesEnrollmentController::class, 'schedule'])->name('pilates.matriculas.schedule');
    Route::post('/appointments', [AgendaController::class, 'store'])->name('appointments.store');
    Route::patch('/appointments/{appointment}', [AgendaController::class, 'update'])->name('appointments.update');
    Route::delete('/appointments/{appointment}', [AgendaController::class, 'destroy'])->name('appointments.destroy');

    Route::resource('professionals', ProfessionalController::class);
    Route::resource('patients', PatientController::class);
    Route::resource('specialties', SpecialtyController::class);
    Route::post('/specialties/{specialty}/subgroups', [\App\Http\Controllers\SpecialtySubgroupController::class, 'store'])->name('specialties.subgroups.store');
    Route::put('/specialties/{specialty}/subgroups/{subgroup}', [\App\Http\Controllers\SpecialtySubgroupController::class, 'update'])->name('specialties.subgroups.update');
    Route::delete('/specialties/{specialty}/subgroups/{subgroup}', [\App\Http\Controllers\SpecialtySubgroupController::class, 'destroy'])->name('specialties.subgroups.destroy');

    Route::prefix('specialties/{specialty}')->name('packages.')->group(function () {
        Route::get('/packages', [\App\Http\Controllers\PackageController::class, 'index'])->name('index');
        Route::post('/packages', [\App\Http\Controllers\PackageController::class, 'store'])->name('store');
    });
    Route::get('/packages', [\App\Http\Controllers\PackageController::class, 'index'])->name('packages.all');
    Route::post('/packages', [\App\Http\Controllers\PackageController::class, 'store'])->name('packages.store_direct');
    Route::put('/packages/{package}', [\App\Http\Controllers\PackageController::class, 'update'])->name('packages.update');
    Route::delete('/packages/{package}', [\App\Http\Controllers\PackageController::class, 'destroy'])->name('packages.destroy');

    Route::get('/settings/agenda', [SettingsController::class, 'agenda'])->name('settings.agenda');
    Route::post('/settings/agenda', [SettingsController::class, 'updateAgenda'])->name('settings.agenda.update');
    Route::get('/settings/packages', [SettingsController::class, 'packages'])->name('settings.packages');
    Route::get('/settings/payment', [SettingsController::class, 'payment'])->name('settings.payment');

    Route::get('/payment-options', [PaymentOptionController::class, 'index'])->name('payment_options.index');
    Route::post('/payment-options', [PaymentOptionController::class, 'store'])->name('payment_options.store');
    Route::put('/payment-options/{paymentOption}', [PaymentOptionController::class, 'update'])->name('payment_options.update');
    Route::delete('/payment-options/{paymentOption}', [PaymentOptionController::class, 'destroy'])->name('payment_options.destroy');

    Route::post('/patients/{patient}/packages', [PatientPackageController::class, 'store'])->name('patients.packages.store');
    Route::get('/patients/{patient}/packages', [PatientPackageController::class, 'index'])->name('patients.packages.index');
    Route::get('/patients/{patient}/appointments', [AgendaController::class, 'patientAppointments'])->name('patients.appointments');
    Route::put('/patient-packages/{patientPackage}', [PatientPackageController::class, 'update'])->name('patients.packages.update');
    Route::delete('/patient-packages/{patientPackage}', [PatientPackageController::class, 'destroy'])->name('patients.packages.destroy');
    Route::patch('/patient-package-installments/{installment}/toggle', [PatientPackageController::class, 'toggleInstallment'])->name('installments.toggle');
    Route::get('/specialties-with-packages', [PatientPackageController::class, 'specialties'])->name('specialties.with_packages');
    Route::get('/specialties-list', [\App\Http\Controllers\SpecialtyController::class, 'list'])->name('specialties.list');
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
