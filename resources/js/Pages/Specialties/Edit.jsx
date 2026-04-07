import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { useState } from 'react';

const PRESET_COLORS = [
    '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
    '#f97316', '#eab308', '#22c55e', '#14b8a6',
    '#06b6d4', '#3b82f6', '#a855f7', '#f43f5e',
];

export default function Edit({ specialty }) {
    const { data, setData, patch, processing, errors } = useForm({
        name: specialty.name,
        color: specialty.color || '#6366f1',
        duration_minutes: specialty.duration_minutes || '',
    });

    const [newSubgroup, setNewSubgroup] = useState('');
    const [addingSubgroup, setAddingSubgroup] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        patch(route('specialties.update', specialty.id));
    };

    const addSubgroup = (e) => {
        e.preventDefault();
        if (!newSubgroup.trim()) return;
        setAddingSubgroup(true);
        router.post(route('specialties.subgroups.store', specialty.id), { name: newSubgroup.trim() }, {
            preserveScroll: true,
            onSuccess: () => { setNewSubgroup(''); setAddingSubgroup(false); },
            onError: () => setAddingSubgroup(false),
        });
    };

    const removeSubgroup = (subgroupId) => {
        router.delete(route('specialties.subgroups.destroy', [specialty.id, subgroupId]), {
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Editar ${specialty.name}`} />
            <section className="mb-8">
                <Link href={route('specialties.index')} className="text-sm text-stone-500 hover:text-primary flex items-center gap-1 mb-4">
                    <span className="material-symbols-outlined text-sm">arrow_back</span>
                    Voltar para lista
                </Link>
                <h1 className="text-3xl font-extrabold tracking-tight text-[#466250]">Editar Especialidade</h1>
                <p className="text-stone-500">Atualize os dados da especialidade {specialty.name}.</p>
            </section>
            <div className="max-w-2xl space-y-6">
                <div className="bg-white dark:bg-stone-900 rounded-3xl p-8 shadow-sm border border-stone-200 dark:border-stone-800">
                    <form onSubmit={submit} className="space-y-6">
                        <div>
                            <InputLabel htmlFor="name" value="Nome da Especialidade" />
                            <TextInput id="name" name="name" value={data.name} className="mt-1 block w-full" isFocused={true} onChange={(e) => setData('name', e.target.value)} required />
                            <InputError message={errors.name} className="mt-2" />
                        </div>
                        <div>
                            <InputLabel value="Cor da Especialidade" />
                            <div className="mt-2 flex flex-wrap gap-2 items-center">
                                {PRESET_COLORS.map(color => (
                                    <button key={color} type="button" onClick={() => setData('color', color)} className="w-8 h-8 rounded-full transition-transform hover:scale-110" style={{ backgroundColor: color, outline: data.color === color ? `3px solid ${color}` : 'none', outlineOffset: '2px' }} />
                                ))}
                                <input type="color" value={data.color} onChange={(e) => setData('color', e.target.value)} className="w-8 h-8 rounded-full cursor-pointer border border-stone-200" title="Cor personalizada" />
                            </div>
                            <div className="mt-3 flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full border border-stone-200" style={{ backgroundColor: data.color }} />
                                <span className="text-sm text-stone-500">{data.color}</span>
                            </div>
                            <InputError message={errors.color} className="mt-2" />
                        </div>
                        <div>
                            <InputLabel htmlFor="duration_minutes" value="Duração (minutos)" />
                            <TextInput id="duration_minutes" type="number" min="1" className="mt-1 block w-full" value={data.duration_minutes} onChange={(e) => setData('duration_minutes', e.target.value)} placeholder="Ex: 50" />
                            <InputError message={errors.duration_minutes} className="mt-2" />
                        </div>
                        <div className="flex items-center justify-end pt-6 border-t border-stone-100 dark:border-stone-800">
                            <PrimaryButton className="px-10 py-3" disabled={processing}>Salvar Alterações</PrimaryButton>
                        </div>
                    </form>
                </div>
                <div className="bg-white dark:bg-stone-900 rounded-3xl p-8 shadow-sm border border-stone-200 dark:border-stone-800">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: (specialty.color || '#6366f1') + '22' }}>
                            <span className="material-symbols-outlined text-lg" style={{ color: specialty.color || '#6366f1' }}>account_tree</span>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-stone-800 dark:text-stone-100">Subgrupos</h2>
                            <p className="text-sm text-stone-400">Variações desta especialidade (ex: Neurológica, Ortopédica)</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-5 min-h-[36px]">
                        {(!specialty.subgroups || specialty.subgroups.length === 0) && (
                            <p className="text-sm text-stone-400 italic">Nenhum subgrupo cadastrado.</p>
                        )}
                        {specialty.subgroups?.map(sub => (
                            <span key={sub.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border" style={{ backgroundColor: (specialty.color || '#6366f1') + '18', borderColor: (specialty.color || '#6366f1') + '44', color: specialty.color || '#6366f1' }}>
                                {sub.name}
                                <button type="button" onClick={() => removeSubgroup(sub.id)} className="ml-0.5 hover:opacity-50 transition-opacity" title="Remover">
                                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
                                </button>
                            </span>
                        ))}
                    </div>
                    <form onSubmit={addSubgroup} className="flex gap-2">
                        <input type="text" value={newSubgroup} onChange={(e) => setNewSubgroup(e.target.value)} placeholder="Nome do subgrupo..." className="flex-1 border border-stone-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#466250]/30 focus:border-[#466250] dark:bg-stone-800 dark:border-stone-700 dark:text-stone-100" />
                        <button type="submit" disabled={addingSubgroup || !newSubgroup.trim()} className="px-4 py-2 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40 flex items-center gap-1" style={{ backgroundColor: specialty.color || '#466250' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
                            Adicionar
                        </button>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
