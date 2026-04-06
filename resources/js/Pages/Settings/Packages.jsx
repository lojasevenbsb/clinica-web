import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SettingsLayout from '@/Layouts/SettingsLayout';
import { Head } from '@inertiajs/react';
import { useState, useRef, useEffect } from 'react';
import TextInput from '@/Components/TextInput';
import axios from 'axios';

export default function Packages({ packages: initialPackages, specialties }) {
    const durationUnits = [
        { value: 'minutes', label: 'Minutos' },
        { value: 'months', label: 'Meses' },
        { value: 'sessions', label: 'Sessões' },
    ];

    const [packages, setPackages] = useState(initialPackages);
    const [adding, setAdding] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({});
    const [newPlan, setNewPlan] = useState({
        name: '',
        price: '',
        duration_value: '',
        duration_unit: 'months',
        specialty_id: '',
    });

    const nameRef = useRef(null);
    const editNameRef = useRef(null);

    useEffect(() => {
        if (adding && nameRef.current) nameRef.current.focus();
    }, [adding]);

    useEffect(() => {
        if (editingId && editNameRef.current) editNameRef.current.focus();
    }, [editingId]);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newPlan.name.trim() || !newPlan.price) return;

        setSaving(true);
        try {
            const payload = {
                ...newPlan,
                duration_value: newPlan.duration_value || null,
            };
            const { data: created } = await axios.post(route('packages.store_direct'), payload);
            setPackages(prev => [...prev, created]);
            setNewPlan({
                name: '',
                price: '',
                duration_value: '',
                duration_unit: 'months',
                specialty_id: '',
            });
            setAdding(false);
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const startEdit = (pkg) => {
        setEditingId(pkg.id);
        setEditData({
            name: pkg.name,
            price: pkg.price,
            duration_value: pkg.duration_value || pkg.duration_months || '',
            duration_unit: pkg.duration_unit || (pkg.duration_months ? 'months' : 'months'),
            specialty_id: pkg.specialty_id || '',
        });
        setAdding(false);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditData({});
    };

    const handleUpdate = async (e, id) => {
        e.preventDefault();
        if (!editData.name.trim() || !editData.price) return;

        setSaving(true);
        try {
            const payload = {
                ...editData,
                duration_value: editData.duration_value || null,
            };
            const { data: updated } = await axios.put(route('packages.update', id), payload);
            setPackages(prev => prev.map(p => p.id === id ? updated : p));
            cancelEdit();
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Deseja excluir este plano?')) return;
        try {
            await axios.delete(route('packages.destroy', id));
            setPackages(prev => prev.filter(p => p.id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    const specialtyName = (id) => {
        if (!id) return null;
        const s = specialties?.find(item => String(item.id) === String(id));
        return s ? s.name : null;
    };

    const durationLabel = (pkg) => {
        const value = pkg.duration_value || pkg.duration_months;
        const unit = pkg.duration_unit || (pkg.duration_months ? 'months' : null);
        if (!value || !unit) return null;

        const dict = {
            minutes: 'minutos',
            months: 'meses',
            sessions: 'sessões',
        };

        return `${value} ${dict[unit] ?? unit}`;
    };

    return (
        <AuthenticatedLayout>
            <Head title="Configurações de Planos" />

            <SettingsLayout
                title="Planos"
                subtitle="Gerencie os planos de sessões disponíveis."
            >
                <div className="bg-white dark:bg-stone-900 rounded-3xl shadow-sm border border-stone-200 dark:border-stone-800 overflow-hidden">
                    <div className="px-6 py-4 border-b border-stone-100 dark:border-stone-800 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#466250]">inventory_2</span>
                        <h3 className="font-bold text-stone-800 dark:text-stone-200">Planos cadastrados</h3>
                        <span className="ml-auto text-xs bg-stone-100 dark:bg-stone-800 text-stone-500 px-2 py-0.5 rounded-full font-medium">
                            {packages.length}
                        </span>
                    </div>

                    <div className="grid grid-cols-12 px-6 py-2 bg-stone-50 dark:bg-stone-800/50 border-b border-stone-100 dark:border-stone-800 text-xs font-bold text-stone-400 uppercase tracking-widest">
                        <span className="col-span-3">Especialidade</span>
                        <span className="col-span-3">Nome</span>
                        <span className="col-span-3 text-center">Duração</span>
                        <span className="col-span-2 text-center">Valor (R$)</span>
                        <span className="col-span-1" />
                    </div>

                    <div className="divide-y divide-stone-50 dark:divide-stone-800">
                        {packages.length === 0 && !adding && (
                            <p className="px-6 py-10 text-center text-stone-400 text-sm">Nenhum plano cadastrado.</p>
                        )}

                        {packages.map(pkg => editingId === pkg.id ? (
                            <form
                                key={pkg.id}
                                onSubmit={(e) => handleUpdate(e, pkg.id)}
                                className="grid grid-cols-12 items-center gap-2 px-6 py-3 bg-[#466250]/5 border-l-4 border-[#466250]"
                            >
                                <div className="col-span-3">
                                    <select
                                        className="w-full text-sm border-stone-200 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 rounded-xl shadow-sm focus:border-[#466250] focus:ring-[#466250]"
                                        value={editData.specialty_id}
                                        onChange={(e) => setEditData(d => ({ ...d, specialty_id: e.target.value }))}
                                    >
                                        <option value="">Nenhuma</option>
                                        {specialties?.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-span-3">
                                    <TextInput
                                        ref={editNameRef}
                                        type="text"
                                        className="w-full text-sm"
                                        value={editData.name}
                                        onChange={(e) => setEditData(d => ({ ...d, name: e.target.value }))}
                                        onKeyDown={(e) => e.key === 'Escape' && cancelEdit()}
                                    />
                                </div>
                                <div className="col-span-3 flex gap-2">
                                    <TextInput
                                        type="number"
                                        min="1"
                                        className="w-1/2 text-sm text-center"
                                        value={editData.duration_value ?? ''}
                                        onChange={(e) => setEditData(d => ({ ...d, duration_value: e.target.value }))}
                                        placeholder="Valor"
                                    />
                                    <select
                                        className="w-1/2 text-sm border-stone-200 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 rounded-xl shadow-sm focus:border-[#466250] focus:ring-[#466250]"
                                        value={editData.duration_unit ?? 'months'}
                                        onChange={(e) => setEditData(d => ({ ...d, duration_unit: e.target.value }))}
                                    >
                                        {durationUnits.map((unit) => (
                                            <option key={unit.value} value={unit.value}>{unit.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <TextInput
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        className="w-full text-sm text-center"
                                        value={editData.price}
                                        onChange={(e) => setEditData(d => ({ ...d, price: e.target.value }))}
                                    />
                                </div>
                                <div className="col-span-12 flex gap-2 justify-end pt-1">
                                    <button
                                        type="submit"
                                        disabled={saving || !editData.name?.trim() || !editData.price}
                                        className="px-4 py-2 bg-[#466250] text-white text-sm font-bold rounded-xl hover:bg-[#384f40] transition-colors disabled:opacity-40"
                                    >
                                        {saving ? 'Salvando...' : 'Salvar'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={cancelEdit}
                                        className="px-3 py-2 text-stone-400 hover:text-stone-600 text-sm rounded-xl hover:bg-stone-100 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div key={pkg.id} className="grid grid-cols-12 items-center px-6 py-3 hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-colors group">
                                <span className="col-span-3 text-xs text-stone-400">
                                    {specialtyName(pkg.specialty_id) || <span className="italic text-stone-300">—</span>}
                                </span>
                                <span className="col-span-3 text-sm font-medium text-stone-800 dark:text-stone-200">{pkg.name}</span>
                                <span className="col-span-3 text-xs text-stone-500 text-center">
                                    {durationLabel(pkg) || <span className="italic text-stone-300">—</span>}
                                </span>
                                <span className="col-span-2 text-sm font-bold text-[#466250] text-center">
                                    {parseFloat(pkg.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                                <div className="col-span-1 flex justify-end items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => startEdit(pkg)}
                                        className="p-1.5 text-stone-400 hover:text-[#466250] transition-colors rounded-lg"
                                    >
                                        <span className="material-symbols-outlined text-sm">edit</span>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(pkg.id)}
                                        className="p-1.5 text-stone-300 hover:text-red-500 transition-colors rounded-lg"
                                    >
                                        <span className="material-symbols-outlined text-sm">delete</span>
                                    </button>
                                </div>
                            </div>
                        ))}

                        {adding && (
                            <form onSubmit={handleAdd} className="grid grid-cols-12 items-center gap-2 px-6 py-3 bg-[#466250]/5 border-t border-[#466250]/10">
                                <div className="col-span-3">
                                    <select
                                        className="w-full text-sm border-stone-200 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 rounded-xl shadow-sm focus:border-[#466250] focus:ring-[#466250]"
                                        value={newPlan.specialty_id}
                                        onChange={(e) => setNewPlan(p => ({ ...p, specialty_id: e.target.value }))}
                                    >
                                        <option value="">Selecione a especialidade</option>
                                        {specialties?.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-span-3">
                                    <TextInput
                                        ref={nameRef}
                                        type="text"
                                        className="w-full text-sm"
                                        placeholder="Nome do plano..."
                                        value={newPlan.name}
                                        onChange={(e) => setNewPlan(p => ({ ...p, name: e.target.value }))}
                                        onKeyDown={(e) => e.key === 'Escape' && setAdding(false)}
                                    />
                                </div>
                                <div className="col-span-3 flex gap-2">
                                    <TextInput
                                        type="number"
                                        min="1"
                                        className="w-1/2 text-sm text-center"
                                        placeholder="Valor"
                                        value={newPlan.duration_value}
                                        onChange={(e) => setNewPlan(p => ({ ...p, duration_value: e.target.value }))}
                                    />
                                    <select
                                        className="w-1/2 text-sm border-stone-200 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 rounded-xl shadow-sm focus:border-[#466250] focus:ring-[#466250]"
                                        value={newPlan.duration_unit}
                                        onChange={(e) => setNewPlan(p => ({ ...p, duration_unit: e.target.value }))}
                                    >
                                        {durationUnits.map((unit) => (
                                            <option key={unit.value} value={unit.value}>{unit.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <TextInput
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        className="w-full text-sm text-center"
                                        placeholder="Valor"
                                        value={newPlan.price}
                                        onChange={(e) => setNewPlan(p => ({ ...p, price: e.target.value }))}
                                    />
                                </div>
                                <div className="col-span-12 flex gap-2 justify-end pt-1">
                                    <button
                                        type="submit"
                                        disabled={saving || !newPlan.name.trim() || !newPlan.price}
                                        className="px-4 py-2 bg-[#466250] text-white text-sm font-bold rounded-xl hover:bg-[#384f40] transition-colors disabled:opacity-40"
                                    >
                                        {saving ? 'Salvando...' : 'Salvar'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAdding(false)}
                                        className="px-3 py-2 text-stone-400 hover:text-stone-600 text-sm rounded-xl hover:bg-stone-100 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>

                    {!adding && !editingId && (
                        <div className="px-6 py-3 border-t border-stone-100 dark:border-stone-800">
                            <button
                                onClick={() => setAdding(true)}
                                className="flex items-center gap-2 text-sm text-[#466250] font-bold hover:bg-[#466250]/5 px-3 py-2 rounded-xl transition-colors w-full"
                            >
                                <span className="material-symbols-outlined text-sm">add</span>
                                Adicionar plano
                            </button>
                        </div>
                    )}
                </div>
            </SettingsLayout>
        </AuthenticatedLayout>
    );
}

