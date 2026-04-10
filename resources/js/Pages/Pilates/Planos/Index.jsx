import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { useState, useEffect } from 'react';

const PERIOD_KEYS  = ['mensal', 'trimestral', 'semestral', 'anual'];
const PERIOD_MONTHS = { mensal: 1, trimestral: 3, semestral: 6, anual: 12 };
const PERIOD_LABELS = { mensal: 'Mensal', trimestral: 'Trimestral', semestral: 'Semestral', anual: 'Anual' };
const PERIOD_DESC   = { mensal: '1 mês', trimestral: '3 meses', semestral: '6 meses', anual: '12 meses' };
const FREQ_LABELS   = { 1: '1x / semana', 2: '2x / semana', 3: '3x / semana' };

function buildMatrixKey(period, freq) {
    return `${period}_${freq}`;
}

function initMatrix(packages, specialtyId) {
    const matrix = {};
    PERIOD_KEYS.forEach(period => {
        [1, 2, 3].forEach(freq => {
            const key = buildMatrixKey(period, freq);
            const months = PERIOD_MONTHS[period];
            const pkg = packages.find(p =>
                String(p.specialty_id) === String(specialtyId) &&
                p.duration_value === months &&
                p.duration_unit === 'months' &&
                p.sessions_per_week === freq
            );
            matrix[key] = pkg ? String(pkg.price) : '';
        });
    });
    return matrix;
}

function formatCurrency(value) {
    const num = parseFloat(String(value).replace(',', '.'));
    if (isNaN(num)) return '—';
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function PilatesPlanos({ packages, specialties }) {
    const [selectedSpecialty, setSelectedSpecialty] = useState(specialties[0]?.id ?? '');
    const [matrix, setMatrix] = useState(() => initMatrix(packages, specialties[0]?.id ?? ''));
    const [saved, setSaved] = useState(false);

    const { post, processing } = useForm();

    useEffect(() => {
        setMatrix(initMatrix(packages, selectedSpecialty));
    }, [selectedSpecialty, packages]);

    const handleSpecialtyChange = (id) => {
        setSelectedSpecialty(id);
    };

    const handlePriceChange = (period, freq, value) => {
        setMatrix(prev => ({ ...prev, [buildMatrixKey(period, freq)]: value }));
    };

    const handleSave = (e) => {
        e.preventDefault();

        const matrixItems = [];
        PERIOD_KEYS.forEach(period => {
            [1, 2, 3].forEach(freq => {
                const raw = matrix[buildMatrixKey(period, freq)];
                const price = raw === '' ? null : parseFloat(String(raw).replace(',', '.'));
                matrixItems.push({ period, frequency: freq, price: isNaN(price) ? null : price });
            });
        });

        post(route('pilates.planos.saveMatrix'), {
            data: { specialty_id: selectedSpecialty, matrix: matrixItems },
            onSuccess: () => {
                setSaved(true);
                setTimeout(() => setSaved(false), 2500);
            },
        });
    };

    const priceFor = (period, freq) => matrix[buildMatrixKey(period, freq)] ?? '';

    return (
        <AuthenticatedLayout>
            <Head title="Planos de Pilates" />

            <div className="space-y-8 max-w-5xl">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-black text-stone-800 dark:text-stone-100 tracking-tight">Planos de Pilates</h1>
                    <p className="text-sm text-stone-500 mt-0.5">Configure os valores para cada período e frequência semanal</p>
                </div>

                {/* Specialty selector */}
                {specialties.length > 1 && (
                    <div className="flex items-center gap-3">
                        <label className="text-sm font-semibold text-stone-600">Especialidade</label>
                        <select
                            className="border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                            value={selectedSpecialty}
                            onChange={e => handleSpecialtyChange(e.target.value)}
                        >
                            {specialties.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Matrix card */}
                <form onSubmit={handleSave}>
                    <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-800 overflow-hidden">
                        {/* Table header */}
                        <div className="grid grid-cols-4 border-b border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50">
                            <div className="px-6 py-4">
                                <span className="text-xs font-semibold text-stone-400 uppercase tracking-wide">Período</span>
                            </div>
                            {[1, 2, 3].map(freq => (
                                <div key={freq} className="px-6 py-4 text-center">
                                    <div className="flex flex-col items-center gap-1">
                                        <span className="material-symbols-outlined text-[#466250] text-[20px]">
                                            {freq === 1 ? 'looks_one' : freq === 2 ? 'looks_two' : 'looks_3'}
                                        </span>
                                        <span className="text-xs font-bold text-stone-600 dark:text-stone-300">{FREQ_LABELS[freq]}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Rows */}
                        {PERIOD_KEYS.map((period, idx) => (
                            <div
                                key={period}
                                className={`grid grid-cols-4 ${idx < PERIOD_KEYS.length - 1 ? 'border-b border-stone-100 dark:border-stone-800' : ''}`}
                            >
                                {/* Period label */}
                                <div className="px-6 py-5 flex flex-col justify-center">
                                    <span className="font-bold text-stone-800 dark:text-stone-100 text-sm">{PERIOD_LABELS[period]}</span>
                                    <span className="text-xs text-stone-400 mt-0.5">{PERIOD_DESC[period]}</span>
                                </div>

                                {/* Price cells */}
                                {[1, 2, 3].map(freq => {
                                    const val = priceFor(period, freq);
                                    const hasValue = val !== '';
                                    return (
                                        <div key={freq} className="px-4 py-4 flex items-center justify-center">
                                            <div className={`relative w-full max-w-[160px] rounded-xl border transition-all ${hasValue ? 'border-[#466250]/40 bg-[#466250]/5' : 'border-stone-200 dark:border-stone-700 bg-transparent'} focus-within:border-[#466250] focus-within:ring-2 focus-within:ring-[#466250]/20`}>
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm font-semibold pointer-events-none">R$</span>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    placeholder="—"
                                                    value={val}
                                                    onChange={e => handlePriceChange(period, freq, e.target.value)}
                                                    className={`w-full pl-9 pr-3 py-2.5 bg-transparent text-sm font-bold rounded-xl outline-none text-right ${hasValue ? 'text-[#466250]' : 'text-stone-400'}`}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>

                    {/* Legend + Save */}
                    <div className="flex items-center justify-between mt-4">
                        <p className="text-xs text-stone-400">
                            Deixe o campo em branco para desativar aquela combinação de plano.
                        </p>
                        <div className="flex items-center gap-3">
                            {saved && (
                                <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
                                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                                    Salvo com sucesso
                                </span>
                            )}
                            <button
                                type="submit"
                                disabled={processing}
                                className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
                            >
                                {processing ? (
                                    <>
                                        <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                                        Salvando...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-[18px]">save</span>
                                        Salvar Planos
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>

                {/* Preview */}
                {PERIOD_KEYS.some(p => [1,2,3].some(f => priceFor(p,f) !== '')) && (
                    <div>
                        <h2 className="text-sm font-bold text-stone-600 dark:text-stone-300 mb-3 uppercase tracking-wide">Prévia dos Planos</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {PERIOD_KEYS.flatMap(period =>
                                [1, 2, 3].map(freq => {
                                    const val = priceFor(period, freq);
                                    if (!val) return null;
                                    return (
                                        <div key={buildMatrixKey(period, freq)}
                                            className="bg-white dark:bg-stone-900 rounded-xl border border-stone-100 dark:border-stone-800 px-5 py-4 flex items-center justify-between shadow-sm">
                                            <div>
                                                <p className="font-bold text-stone-800 dark:text-stone-100 text-sm">
                                                    {PERIOD_LABELS[period]} · {freq}x/sem
                                                </p>
                                                <p className="text-xs text-stone-400 mt-0.5">{PERIOD_DESC[period]}</p>
                                            </div>
                                            <span className="text-base font-black text-[#466250]">{formatCurrency(val)}</span>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
