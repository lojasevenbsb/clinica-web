import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SettingsLayout from '@/Layouts/SettingsLayout';
import { Head } from '@inertiajs/react';
import { useState, useRef, useEffect } from 'react';
import TextInput from '@/Components/TextInput';
import axios from 'axios';

function PaymentGroup({ title, group, items: initialItems }) {
    const [items, setItems] = useState(initialItems);
    const [adding, setAdding] = useState(false);
    const [newName, setNewName] = useState('');
    const [saving, setSaving] = useState(false);
    const inputRef = useRef(null);

    useEffect(() => {
        if (adding && inputRef.current) {
            inputRef.current.focus();
        }
    }, [adding]);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newName.trim()) return;
        setSaving(true);
        try {
            const { data: created } = await axios.post(route('payment_options.store'), { group, name: newName.trim() });
            setItems(prev => [...prev, created]);
            setNewName('');
            setAdding(false);
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setNewName('');
        setAdding(false);
    };

    const handleDelete = async (id) => {
        if (!confirm('Deseja remover esta opção?')) return;
        try {
            await axios.delete(route('payment_options.destroy', id));
            setItems(prev => prev.filter(i => i.id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="bg-white dark:bg-stone-900 rounded-3xl shadow-sm border border-stone-200 dark:border-stone-800 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-stone-100 dark:border-stone-800 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#466250]">
                    {group === 'method' ? 'payments' : 'category'}
                </span>
                <h3 className="font-bold text-stone-800 dark:text-stone-200">{title}</h3>
                <span className="ml-auto text-xs bg-stone-100 dark:bg-stone-800 text-stone-500 px-2 py-0.5 rounded-full font-medium">
                    {items.length}
                </span>
            </div>

            {/* List */}
            <div className="divide-y divide-stone-50 dark:divide-stone-800">
                {items.length === 0 && !adding ? (
                    <p className="px-6 py-8 text-center text-stone-400 text-sm">Nenhuma opção cadastrada.</p>
                ) : (
                    items.map(item => (
                        <div key={item.id} className="flex items-center justify-between px-6 py-3 hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-colors group">
                            <span className="text-sm text-stone-700 dark:text-stone-300">{item.name}</span>
                            <button
                                onClick={() => handleDelete(item.id)}
                                className="p-1.5 text-stone-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 rounded-lg"
                            >
                                <span className="material-symbols-outlined text-sm">delete</span>
                            </button>
                        </div>
                    ))
                )}

                {/* Inline add form */}
                {adding && (
                    <form onSubmit={handleAdd} className="px-6 py-3 flex items-center gap-2 bg-[#466250]/5 border-t border-[#466250]/10">
                        <TextInput
                            ref={inputRef}
                            type="text"
                            className="flex-1 text-sm"
                            placeholder={`Nome da ${title.toLowerCase().replace('s de pagamento', '').trim()}...`}
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Escape' && handleCancel()}
                        />
                        <button
                            type="submit"
                            disabled={saving || !newName.trim()}
                            className="px-4 py-2 bg-[#466250] text-white text-sm font-bold rounded-xl hover:bg-[#384f40] transition-colors disabled:opacity-40"
                        >
                            {saving ? 'Salvando...' : 'Salvar'}
                        </button>
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="px-3 py-2 text-stone-400 hover:text-stone-600 text-sm rounded-xl hover:bg-stone-100 transition-colors"
                        >
                            Cancelar
                        </button>
                    </form>
                )}
            </div>

            {/* Footer */}
            {!adding && (
                <div className="px-6 py-3 border-t border-stone-100 dark:border-stone-800">
                    <button
                        onClick={() => setAdding(true)}
                        className="flex items-center gap-2 text-sm text-[#466250] font-bold hover:bg-[#466250]/5 px-3 py-2 rounded-xl transition-colors w-full"
                    >
                        <span className="material-symbols-outlined text-sm">add</span>
                        Adicionar {group === 'method' ? 'forma' : 'tipo'}
                    </button>
                </div>
            )}
        </div>
    );
}

export default function Payment({ methods, types }) {
    return (
        <AuthenticatedLayout>
            <Head title="Configurações de Pagamento" />

            <SettingsLayout
                title="Pagamentos"
                subtitle="Gerencie as formas e tipos de pagamento disponíveis."
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <PaymentGroup title="Formas de Pagamento" group="method" items={methods} />
                    <PaymentGroup title="Tipos de Pagamento"  group="type"   items={types}   />
                </div>
            </SettingsLayout>
        </AuthenticatedLayout>
    );
}
