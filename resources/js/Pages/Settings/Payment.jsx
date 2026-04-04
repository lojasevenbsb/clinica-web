import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SettingsLayout from '@/Layouts/SettingsLayout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';

function PaymentGroup({ title, group, items: initialItems }) {
    const [items, setItems] = useState(initialItems);
    const [newName, setNewName] = useState('');
    const [saving, setSaving] = useState(false);

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newName.trim()) return;
        setSaving(true);
        try {
            const res = await fetch(route('payment_options.store'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
                },
                body: JSON.stringify({ group, name: newName.trim() }),
            });
            const created = await res.json();
            setItems(prev => [...prev, created]);
            setNewName('');
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Deseja remover esta opção?')) return;
        try {
            await fetch(route('payment_options.destroy', id), {
                method: 'DELETE',
                headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content },
            });
            setItems(prev => prev.filter(i => i.id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="bg-white dark:bg-stone-900 rounded-3xl shadow-sm border border-stone-200 dark:border-stone-800 overflow-hidden">
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
                {items.length === 0 ? (
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
            </div>

            {/* Add form */}
            <div className="px-6 py-4 bg-stone-50 dark:bg-stone-800/50 border-t border-stone-100 dark:border-stone-800">
                <form onSubmit={handleAdd} className="flex gap-2">
                    <TextInput
                        type="text"
                        className="flex-1 text-sm"
                        placeholder={`Nova ${title.toLowerCase()}...`}
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                    />
                    <PrimaryButton type="submit" disabled={saving} className="gap-1">
                        <span className="material-symbols-outlined text-sm">add</span>
                        Adicionar
                    </PrimaryButton>
                </form>
            </div>
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
