<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ProfessionalController;
use App\Http\Controllers\PatientController;
use App\Http\Controllers\SpecialtyController;
use App\Http\Controllers\AgendaController;
use App\Http\Controllers\SettingsController;
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
    Route::post('/appointments', [AgendaController::class, 'store'])->name('appointments.store');
    Route::patch('/appointments/{appointment}', [AgendaController::class, 'update'])->name('appointments.update');
    Route::delete('/appointments/{appointment}', [AgendaController::class, 'destroy'])->name('appointments.destroy');

    Route::resource('professionals', ProfessionalController::class);
    Route::resource('patients', PatientController::class);
    Route::resource('specialties', SpecialtyController::class);
    
    Route::prefix('specialties/{specialty}')->name('packages.')->group(function () {
        Route::get('/packages', [\App\Http\Controllers\PackageController::class, 'index'])->name('index');
        Route::post('/packages', [\App\Http\Controllers\PackageController::class, 'store'])->name('store');
    });
    Route::delete('/packages/{package}', [\App\Http\Controllers\PackageController::class, 'destroy'])->name('destroy');

    Route::get('/settings/agenda', [SettingsController::class, 'agenda'])->name('settings.agenda');
    Route::post('/settings/agenda', [SettingsController::class, 'updateAgenda'])->name('settings.agenda.update');
    Route::get('/settings/packages', [SettingsController::class, 'packages'])->name('settings.packages');

    Route::post('/patients/{patient}/packages', [PatientPackageController::class, 'store'])->name('patients.packages.store');
    Route::get('/patients/{patient}/packages', [PatientPackageController::class, 'index'])->name('patients.packages.index');
    Route::get('/specialties-with-packages', [PatientPackageController::class, 'specialties'])->name('specialties.with_packages');
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
