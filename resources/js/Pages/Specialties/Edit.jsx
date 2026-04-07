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

function SubgroupRow({ sub, specialtyId, color }) {
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({
        name: sub.name,
        duration_minutes: sub.duration_minutes || '',
    });
    const [saving, setSaving] = useState(false);

    const save = () => {
        setSaving(true);
        router.put(route('specialties.subgroups.update', [specialtyId, sub.id]), form, {
            preserveScroll: true,
            onSuccess: () => { setEditing(false); setSaving(false); },
            onError: () => setSaving(false),
        });
    };

    const remove = () => {
        router.delete(route('specialties.subgroups.destroy', [specialtyId, sub.id]), {
            preserveScroll: true,
        });
    };

    if (editing) {
        return (
            <tr className="bg-stone-50 dark:bg-stone-800/40">
                <td className="px-4 py-2">
                    <input
                        type="text"
                        value={form.name}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        className="w-full border border-stone-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#466250]/30"
                        placeholder="Nome"
                    />
                </td>
                <td className="px-4 py-2">
                    <input
                        type="number"
                        min="1"
                        value={form.duration_minutes}
                        onChange={e => setForm(f => ({ ...f, duration_minutes: e.target.value }))}
                        className="w-full border border-stone-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#466250]/30"
                        placeholder="min"
                    />
                </td>
                <td className="px-4 py-2 text-right">
                    <div className="flex justify-end gap-1">
                        <button onClick={save} disabled={saving || !form.name.trim()} className="p-1.5 rounded-lg text-white disabled:opacity-40" style={{ backgroundColor: color || '#466250' }} title="Salvar">
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check</span>
                        </button>
                        <button onClick={() => setEditing(false)} className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100" title="Cancelar">
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
                        </button>
                    </div>
                </td>
            </tr>
        );
    }

    return (
        <tr className="border-t border-stone-100 dark:border-stone-700 hover:bg-stone-50/50 dark:hover:bg-stone-800/20 transition-colors">
            <td className="px-4 py-3">
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: color || '#6366f1' }}>
                    <span className="w-2 h-2 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: color || '#6366f1' }}></span>
                    {sub.name}
                </span>
            </td>
            <td className="px-4 py-3 text-sm text-stone-500">
                {sub.duration_minutes ? `${sub.duration_minutes} min` : <span className="text-stone-300">—</span>}
            </td>
            <td className="px-4 py-3 text-right">
                <div className="flex justify-end gap-1">
                    <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg text-stone-400 hover:text-primary hover:bg-stone-100 transition-colors" title="Editar">
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                    </button>
                    <button onClick={remove} className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Remover">
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                    </button>
                </div>
            </td>
        </tr>
    );
}

export default function Edit({ specialty }) {
    const { data, setData, patch, processing, errors } = useForm({
        name: specialty.name,
        color: specialty.color || '#6366f1',
        duration_minutes: specialty.duration_minutes || '',
    });

    const [newSub, setNewSub] = useState({ name: '', duration_minutes: '' });
    const [adding, setAdding] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        patch(route('specialties.update', specialty.id));
    };

    const addSubgroup = (e) => {
        e.preventDefault();
        if (!newSub.name.trim()) return;
        setAdding(true);
        router.post(route('specialties.subgroups.store', specialty.id), newSub, {
            preserveScroll: true,
            onSuccess: () => { setNewSub({ name: '', duration_minutes: '' }); setAdding(false); },
            onError: () => setAdding(false),
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
                {/* Main form */}
                <div className="bg-white dark:bg-stone-900 rounded-3xl p-8 shadow-sm border border-stone-200 dark:border-stone-800">
                    <form onSubmit={submit} className="space-y-6">
                        <div>
                            <InputLabel htmlFor="name" value="Nome da Especialidade" />
                            <TextInput id="name" name="name" value={data.name} className="mt-1 block w-full" isFocused onChange={(e) => setData('name', e.target.value)} required />
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
                            <InputLabel htmlFor="duration_minutes" value="Duração padrão (minutos)" />
                            <TextInput id="duration_minutes" type="number" min="1" className="mt-1 block w-full" value={data.duration_minutes} onChange={(e) => setData('duration_minutes', e.target.value)} placeholder="Ex: 50" />
                            <p className="text-xs text-stone-400 mt-1">Será usada quando o subgrupo não tiver duração própria.</p>
                            <InputError message={errors.duration_minutes} className="mt-2" />
                        </div>
                        <div className="flex items-center justify-end pt-6 border-t border-stone-100 dark:border-stone-800">
                            <PrimaryButton className="px-10 py-3" disabled={processing}>Salvar Alterações</PrimaryButton>
                        </div>
                    </form>
                </div>

                {/* Subgroups */}
                <div className="bg-white dark:bg-stone-900 rounded-3xl shadow-sm border border-stone-200 dark:border-stone-800 overflow-hidden">
                    <div className="flex items-center gap-3 px-8 py-6 border-b border-stone-100 dark:border-stone-700">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: (specialty.color || '#6366f1') + '22' }}>
                            <span className="material-symbols-outlined text-lg" style={{ color: specialty.color || '#6366f1' }}>account_tree</span>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-stone-800 dark:text-stone-100">Subgrupos</h2>
                            <p className="text-sm text-stone-400">Variações desta especialidade com duração própria</p>
                        </div>
                    </div>

                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-stone-50 dark:bg-stone-800/50">
                                <th className="px-4 py-2.5 text-xs font-bold text-stone-400 uppercase tracking-wider">Nome</th>
                                <th className="px-4 py-2.5 text-xs font-bold text-stone-400 uppercase tracking-wider">Duração</th>
                                <th className="px-4 py-2.5"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {(!specialty.subgroups || specialty.subgroups.length === 0) && (
                                <tr>
                                    <td colSpan="3" className="px-4 py-6 text-center text-sm text-stone-400 italic">
                                        Nenhum subgrupo cadastrado.
                                    </td>
                                </tr>
                            )}
                            {specialty.subgroups?.map(sub => (
                                <SubgroupRow key={sub.id} sub={sub} specialtyId={specialty.id} color={specialty.color} />
                            ))}
                            {/* Add row */}
                            <tr className="border-t-2 border-dashed border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/20">
                                <td className="px-4 py-3">
                                    <input type="text" value={newSub.name} onChange={e => setNewSub(s => ({ ...s, name: e.target.value }))} placeholder="Nome do subgrupo..." className="w-full border border-stone-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#466250]/30 focus:border-[#466250] bg-white dark:bg-stone-800 dark:border-stone-700" />
                                </td>
                                <td className="px-4 py-3">
                                    <input type="number" min="1" value={newSub.duration_minutes} onChange={e => setNewSub(s => ({ ...s, duration_minutes: e.target.value }))} placeholder="min" className="w-full border border-stone-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#466250]/30 bg-white dark:bg-stone-800 dark:border-stone-700" />
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <button onClick={addSubgroup} disabled={adding || !newSub.name.trim()} className="px-3 py-1.5 rounded-lg text-sm font-bold text-white flex items-center gap-1 ml-auto disabled:opacity-40" style={{ backgroundColor: specialty.color || '#466250' }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
                                        Adicionar
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
