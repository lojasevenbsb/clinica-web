import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';

function makeId() {
    return Math.random().toString(36).slice(2);
}

function initPlans(packages, specialtyId) {
    const filtered = packages.filter(p => String(p.specialty_id) === String(specialtyId));
    if (filtered.length === 0) return [];

    // Group by (name, duration_value, duration_unit)
    const groupMap = new Map();
    filtered.forEach(pkg => {
        const key = `${pkg.name}|${pkg.duration_value}|${pkg.duration_unit}`;
        if (!groupMap.has(key)) {
            groupMap.set(key, {
                localId: makeId(),
                name: pkg.name ?? '',
                duration_value: String(pkg.duration_value ?? 1),
                duration_unit: pkg.duration_unit ?? 'months',
                frequencies: [],
            });
        }
        if (pkg.sessions_per_week != null) {
            groupMap.get(key).frequencies.push({
                localId: makeId(),
                sessions_per_week: String(pkg.sessions_per_week),
                price: String(pkg.price ?? ''),
            });
        }
    });

    return Array.from(groupMap.values());
}

export default function PilatesPlanos({ packages, specialties }) {
    const [selectedSpecialty, setSelectedSpecialty] = useState(specialties[0]?.id ?? '');
    const [plans, setPlans] = useState(() => initPlans(packages, specialties[0]?.id ?? ''));
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [saveError, setSaveError] = useState(null);

    // Ref sempre atualizado com os packages mais recentes, evitando stale closure.
    const packagesRef = useRef(packages);
    packagesRef.current = packages;

    // Reinicializa os planos SOMENTE quando o usuário troca de especialidade.
    // NÃO depende de `packages` para evitar que uma re-renderização do Inertia
    // (após save com erro ou sucesso) apague os dados que o usuário acabou de digitar.
    useEffect(() => {
        setPlans(initPlans(packagesRef.current, selectedSpecialty));
    }, [selectedSpecialty]);

    /* ── Plan operations ── */
    const addPlan = () => {
        setPlans(prev => [...prev, {
            localId: makeId(),
            name: '',
            duration_value: '1',
            duration_unit: 'months',
            frequencies: [],
        }]);
    };

    const removePlan = (id) => setPlans(prev => prev.filter(p => p.localId !== id));

    const updatePlan = (id, field, value) =>
        setPlans(prev => prev.map(p => p.localId === id ? { ...p, [field]: value } : p));

    /* ── Frequency operations ── */
    const addFrequency = (planId) => {
        setPlans(prev => prev.map(p => {
            if (p.localId !== planId) return p;
            return { ...p, frequencies: [...p.frequencies, { localId: makeId(), sessions_per_week: '', price: '' }] };
        }));
    };

    const removeFrequency = (planId, freqId) => {
        setPlans(prev => prev.map(p => {
            if (p.localId !== planId) return p;
            return { ...p, frequencies: p.frequencies.filter(f => f.localId !== freqId) };
        }));
    };

    const updateFrequency = (planId, freqId, field, value) => {
        setPlans(prev => prev.map(p => {
            if (p.localId !== planId) return p;
            return { ...p, frequencies: p.frequencies.map(f => f.localId === freqId ? { ...f, [field]: value } : f) };
        }));
    };

    /* ── Save ── */
    const handleSave = (e) => {
        e.preventDefault();
        setSaving(true);

        const payload = {
            specialty_id: selectedSpecialty,
            plans: plans
                .filter(p => p.name.trim() !== '' && p.frequencies.some(f => f.sessions_per_week !== '' && f.price !== ''))
                .map(p => ({
                    name: p.name.trim(),
                    duration_value: parseInt(p.duration_value) || 1,
                    duration_unit: p.duration_unit,
                    frequencies: p.frequencies
                        .filter(f => f.sessions_per_week !== '' && f.price !== '')
                        .map(f => ({
                            sessions_per_week: parseInt(f.sessions_per_week),
                            price: parseFloat(String(f.price).replace(',', '.')),
                        })),
                })),
        };

        router.post(route('pilates.planos.savePlans'), payload, {
            preserveScroll: true,
            onSuccess: (page) => {
                setSaveError(null);
                // Reinicializa com os dados atualizados que vieram do servidor
                const freshPackages = page?.props?.packages ?? packagesRef.current;
                setPlans(initPlans(freshPackages, selectedSpecialty));
                setSaved(true);
                setTimeout(() => setSaved(false), 2500);
            },
            onError: (errors) => {
                const first = Object.values(errors)[0];
                setSaveError(first ?? 'Erro ao salvar. Verifique os dados e tente novamente.');
            },
            onFinish: () => setSaving(false),
        });
    };

    const hasAnySaveable = plans.some(p =>
        p.name.trim() !== '' && p.frequencies.some(f => f.sessions_per_week !== '' && f.price !== '')
    );

    return (
        <AuthenticatedLayout>
            <Head title="Planos de Pilates" />

            <div className="space-y-6 max-w-3xl">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-stone-800 dark:text-stone-100 tracking-tight">Planos de Pilates</h1>
                        <p className="text-sm text-stone-500 mt-0.5">Crie e gerencie os planos disponíveis para os alunos</p>
                    </div>
                    <button
                        type="button"
                        onClick={addPlan}
                        className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-sm"
                    >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        Novo Plano
                    </button>
                </div>

                {/* Specialty selector */}
                {specialties.length > 1 && (
                    <div className="flex items-center gap-3">
                        <label className="text-sm font-semibold text-stone-600">Especialidade</label>
                        <select
                            className="border border-stone-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                            value={selectedSpecialty}
                            onChange={e => setSelectedSpecialty(e.target.value)}
                        >
                            {specialties.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Plan list */}
                <form onSubmit={handleSave} className="space-y-4">
                    {plans.length === 0 ? (
                        <div className="text-center py-16 bg-white dark:bg-stone-900 rounded-2xl border border-dashed border-stone-200 dark:border-stone-700">
                            <span className="material-symbols-outlined text-stone-300 text-[48px]">package_2</span>
                            <p className="text-stone-400 text-sm mt-2">Nenhum plano criado ainda</p>
                            <button
                                type="button"
                                onClick={addPlan}
                                className="mt-4 text-sm text-primary font-semibold hover:underline"
                            >
                                Criar primeiro plano
                            </button>
                        </div>
                    ) : (
                        <>
                            {plans.map(plan => (
                                <PlanCard
                                    key={plan.localId}
                                    plan={plan}
                                    onUpdate={(f, v) => updatePlan(plan.localId, f, v)}
                                    onRemove={() => removePlan(plan.localId)}
                                    onAddFrequency={() => addFrequency(plan.localId)}
                                    onRemoveFrequency={fId => removeFrequency(plan.localId, fId)}
                                    onUpdateFrequency={(fId, f, v) => updateFrequency(plan.localId, fId, f, v)}
                                />
                            ))}

                            <div className="flex items-center justify-between pt-2">
                                <p className="text-xs text-stone-400">
                                    Planos sem nome ou sem frequências com preço não serão salvos.
                                </p>
                                <div className="flex items-center gap-3">
                                    {saveError && (
                                        <span className="flex items-center gap-1.5 text-sm font-semibold text-red-600">
                                            <span className="material-symbols-outlined text-[18px]">error</span>
                                            {saveError}
                                        </span>
                                    )}
                                    {saved && !saveError && (
                                        <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
                                            <span className="material-symbols-outlined text-[18px]">check_circle</span>
                                            Salvo com sucesso
                                        </span>
                                    )}
                                    <button
                                        type="submit"
                                        disabled={saving || !hasAnySaveable}
                                        className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
                                    >
                                        {saving ? (
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
                        </>
                    )}
                </form>
            </div>
        </AuthenticatedLayout>
    );
}

function PlanCard({ plan, onUpdate, onRemove, onAddFrequency, onRemoveFrequency, onUpdateFrequency }) {
    return (
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-100 dark:border-stone-800 shadow-sm overflow-hidden">
            {/* Plan header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-stone-100 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-800/40">
                {/* Name */}
                <div className="flex-1 min-w-0">
                    <input
                        type="text"
                        placeholder="Nome do plano (ex: Plano Mensal)"
                        value={plan.name}
                        onChange={e => onUpdate('name', e.target.value)}
                        className="w-full px-3 py-2 border border-stone-200 dark:border-stone-700 rounded-xl text-sm font-semibold text-stone-800 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 bg-white dark:bg-stone-900"
                    />
                </div>

                {/* Duration */}
                <div className="flex items-center gap-1.5 shrink-0">
                    <span className="material-symbols-outlined text-stone-400 text-[16px]">schedule</span>
                    <input
                        type="number"
                        min="1"
                        placeholder="1"
                        value={plan.duration_value}
                        onChange={e => onUpdate('duration_value', e.target.value)}
                        className="w-14 px-2 py-2 border border-stone-200 dark:border-stone-700 rounded-xl text-sm text-center font-bold text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 bg-white dark:bg-stone-900"
                    />
                    <select
                        value={plan.duration_unit}
                        onChange={e => onUpdate('duration_unit', e.target.value)}
                        className="px-2 py-2 border border-stone-200 dark:border-stone-700 rounded-xl text-sm text-stone-700 dark:text-stone-300 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 bg-white dark:bg-stone-900"
                    >
                        <option value="days">dias</option>
                        <option value="weeks">semanas</option>
                        <option value="months">meses</option>
                    </select>
                </div>

                {/* Remove plan */}
                <button
                    type="button"
                    onClick={onRemove}
                    title="Remover plano"
                    className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors shrink-0"
                >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
            </div>

            {/* Frequencies */}
            <div className="px-5 py-4 space-y-2.5">
                {plan.frequencies.length === 0 && (
                    <p className="text-xs text-stone-400 italic px-1">
                        Nenhuma frequência adicionada. Adicione frequências para definir os preços.
                    </p>
                )}

                {plan.frequencies.map(freq => (
                    <div key={freq.localId} className="flex items-center gap-3">
                        {/* Frequency */}
                        <div className="flex items-center gap-1.5 shrink-0">
                            <span className="material-symbols-outlined text-stone-400 text-[15px]">repeat</span>
                            <input
                                type="number"
                                min="1"
                                max="7"
                                placeholder="2"
                                value={freq.sessions_per_week}
                                onChange={e => onUpdateFrequency(freq.localId, 'sessions_per_week', e.target.value)}
                                className="w-12 px-2 py-2 border border-stone-200 dark:border-stone-700 rounded-xl text-sm text-center font-bold text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 bg-stone-50 dark:bg-stone-800"
                            />
                            <span className="text-xs text-stone-500 font-medium whitespace-nowrap">x / semana</span>
                        </div>

                        {/* Price */}
                        <div className="relative w-40 shrink-0">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm font-semibold pointer-events-none select-none">R$</span>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0,00"
                                value={freq.price}
                                onChange={e => onUpdateFrequency(freq.localId, 'price', e.target.value)}
                                className="w-full pl-9 pr-3 py-2 border border-stone-200 dark:border-stone-700 rounded-xl text-sm font-bold text-right text-stone-800 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 bg-stone-50 dark:bg-stone-800"
                            />
                        </div>

                        {/* Remove frequency */}
                        <button
                            type="button"
                            onClick={() => onRemoveFrequency(freq.localId)}
                            className="p-1 text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors shrink-0"
                        >
                            <span className="material-symbols-outlined text-[16px]">close</span>
                        </button>
                    </div>
                ))}

                <button
                    type="button"
                    onClick={onAddFrequency}
                    className="flex items-center gap-1.5 text-xs text-primary font-semibold px-3 py-1.5 rounded-xl hover:bg-primary/5 transition-colors"
                >
                    <span className="material-symbols-outlined text-[14px]">add</span>
                    Adicionar frequência
                </button>
            </div>
        </div>
    );
}
