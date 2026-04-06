import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';

const PRESET_COLORS = [
    '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
    '#f97316', '#eab308', '#22c55e', '#14b8a6',
    '#06b6d4', '#3b82f6', '#a855f7', '#f43f5e',
];

export default function Edit({ specialty }) {
    const { data, setData, patch, processing, errors } = useForm({
        name: specialty.name,
        color: specialty.color || '#6366f1',
    });

    const submit = (e) => {
        e.preventDefault();
        patch(route('specialties.update', specialty.id));
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
                <p className="text-stone-500">Atualize o nome da especialidade {specialty.name}.</p>
            </section>

            <div className="max-w-2xl bg-white dark:bg-stone-900 rounded-3xl p-8 shadow-sm border border-stone-200 dark:border-stone-800">
                <form onSubmit={submit} className="space-y-6">
                    <div>
                        <InputLabel htmlFor="name" value="Nome da Especialidade" />
                        <TextInput
                            id="name"
                            name="name"
                            value={data.name}
                            className="mt-1 block w-full"
                            isFocused={true}
                            onChange={(e) => setData('name', e.target.value)}
                            required
                        />
                        <InputError message={errors.name} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel value="Cor da Especialidade" />
                        <div className="mt-2 flex flex-wrap gap-2 items-center">
                            {PRESET_COLORS.map(color => (
                                <button
                                    key={color}
                                    type="button"
                                    onClick={() => setData('color', color)}
                                    className="w-8 h-8 rounded-full transition-transform hover:scale-110"
                                    style={{
                                        backgroundColor: color,
                                        outline: data.color === color ? `3px solid ${color}` : 'none',
                                        outlineOffset: '2px',
                                    }}
                                />
                            ))}
                            <input
                                type="color"
                                value={data.color}
                                onChange={(e) => setData('color', e.target.value)}
                                className="w-8 h-8 rounded-full cursor-pointer border border-stone-200"
                                title="Cor personalizada"
                            />
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full border border-stone-200" style={{ backgroundColor: data.color }} />
                            <span className="text-sm text-stone-500">{data.color}</span>
                        </div>
                        <InputError message={errors.color} className="mt-2" />
                    </div>

                    <div className="flex items-center justify-end mt-8 pt-6 border-t border-stone-100 dark:border-stone-800">
                        <PrimaryButton className="px-10 py-3" disabled={processing}>
                            Salvar Alterações
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
