import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';

export default function Create() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        duration_minutes: 60,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('specialties.store'));
    };

    return (
        <AuthenticatedLayout>
            <Head title="Nova Especialidade" />

            <section className="mb-8">
                <Link href={route('specialties.index')} className="text-sm text-stone-500 hover:text-primary flex items-center gap-1 mb-4">
                    <span className="material-symbols-outlined text-sm">arrow_back</span>
                    Voltar para lista
                </Link>
                <h1 className="text-3xl font-extrabold tracking-tight text-[#466250]">Nova Especialidade</h1>
                <p className="text-stone-500">Cadastre uma nova especialidade para os atendimentos.</p>
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
                            placeholder="Ex: Pilates, Fisioterapia, etc."
                        />
                        <InputError message={errors.name} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="duration_minutes" value="Duração (em minutos)" />
                        <TextInput
                            id="duration_minutes"
                            type="number"
                            name="duration_minutes"
                            value={data.duration_minutes}
                            className="mt-1 block w-full"
                            onChange={(e) => setData('duration_minutes', e.target.value)}
                            required
                            min="1"
                            max="480"
                        />
                        <InputError message={errors.duration_minutes} className="mt-2" />
                    </div>

                    <div className="flex items-center justify-end mt-8 pt-6 border-t border-stone-100 dark:border-stone-800">
                        <PrimaryButton className="px-10 py-3" disabled={processing}>
                            Salvar Especialidade
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
