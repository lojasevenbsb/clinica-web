import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';

export default function Edit({ patient }) {
    const { data, setData, patch, processing, errors, reset } = useForm({
        name: patient.name,
        birth_date: patient.birth_date,
        cpf: patient.cpf,
        email: patient.email || '',
        phone: patient.phone || '',
        address: patient.address || '',
    });

    const submit = (e) => {
        e.preventDefault();
        patch(route('patients.update', patient.id));
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Editar ${patient.name}`} />

            <section className="mb-8">
                <Link href={route('patients.index')} className="text-sm text-stone-500 hover:text-primary flex items-center gap-1 mb-4">
                    <span className="material-symbols-outlined text-sm">arrow_back</span>
                    Voltar para lista
                </Link>
                <h1 className="text-3xl font-extrabold tracking-tight text-[#466250]">Editar Cadastro</h1>
                <p className="text-stone-500">Atualize as informações de {patient.name}.</p>
            </section>

            <div className="max-w-4xl bg-white dark:bg-stone-900 rounded-3xl p-8 shadow-sm border border-stone-200 dark:border-stone-800">
                <form onSubmit={submit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <InputLabel htmlFor="name" value="Nome Completo" />
                            <TextInput
                                id="name"
                                name="name"
                                value={data.name}
                                className="mt-1 block w-full"
                                autoComplete="name"
                                isFocused={true}
                                onChange={(e) => setData('name', e.target.value)}
                                required
                            />
                            <InputError message={errors.name} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="cpf" value="CPF" />
                            <TextInput
                                id="cpf"
                                name="cpf"
                                value={data.cpf}
                                className="mt-1 block w-full"
                                onChange={(e) => setData('cpf', e.target.value)}
                                required
                            />
                            <InputError message={errors.cpf} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="birth_date" value="Data de Nascimento" />
                            <TextInput
                                id="birth_date"
                                type="date"
                                name="birth_date"
                                value={data.birth_date}
                                className="mt-1 block w-full"
                                onChange={(e) => setData('birth_date', e.target.value)}
                                required
                            />
                            <InputError message={errors.birth_date} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="email" value="E-mail" />
                            <TextInput
                                id="email"
                                type="email"
                                name="email"
                                value={data.email}
                                className="mt-1 block w-full"
                                autoComplete="email"
                                onChange={(e) => setData('email', e.target.value)}
                            />
                            <InputError message={errors.email} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="phone" value="Telefone / WhatsApp" />
                            <TextInput
                                id="phone"
                                name="phone"
                                value={data.phone}
                                className="mt-1 block w-full"
                                onChange={(e) => setData('phone', e.target.value)}
                            />
                            <InputError message={errors.phone} className="mt-2" />
                        </div>

                        <div className="md:col-span-2">
                            <InputLabel htmlFor="address" value="Endereço" />
                            <textarea
                                id="address"
                                className="mt-1 block w-full bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 rounded-xl text-sm focus:ring-primary focus:border-primary transition-all min-h-[100px]"
                                onChange={(e) => setData('address', e.target.value)}
                                value={data.address}
                            />
                            <InputError message={errors.address} className="mt-2" />
                        </div>
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
