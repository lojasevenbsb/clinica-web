import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';

export default function Edit({ professional, specialties }) {
    const { data, setData, patch, processing, errors, reset } = useForm({
        name: professional.name,
        registration_number: professional.registration_number || '',
        email: professional.email || '',
        phone: professional.phone || '',
        color: professional.color,
        specialties: professional.specialties.map(s => s.id),
    });

    const toggleSpecialty = (id) => {
        const newSpecialties = data.specialties.includes(id)
            ? data.specialties.filter((s) => s !== id)
            : [...data.specialties, id];
        setData('specialties', newSpecialties);
    };

    const submit = (e) => {
        e.preventDefault();
        patch(route('professionals.update', professional.id));
    };

    const colorOptions = [
        { name: 'Verde Clínica', value: '#466250' },
        { name: 'Sálvia', value: '#789682' },
        { name: 'Ocre', value: '#B4844D' },
        { name: 'Terracota', value: '#A65D46' },
        { name: 'Slate', value: '#475569' },
        { name: 'Indigo', value: '#4F46E5' },
    ];

    return (
        <AuthenticatedLayout>
            <Head title={`Editar ${professional.name}`} />

            <section className="mb-8">
                <Link href={route('professionals.index')} className="text-sm text-on-surface-variant hover:text-primary flex items-center gap-1 mb-4">
                    <span className="material-symbols-outlined text-sm">arrow_back</span>
                    Voltar para lista
                </Link>
                <h1 className="text-3xl font-extrabold tracking-tight text-primary">Editar Profissional</h1>
                <p className="text-on-surface-variant">Atualize as informações de {professional.name}.</p>
            </section>

            <div className="max-w-3xl bg-white dark:bg-stone-900 rounded-3xl p-8 shadow-sm border border-outline-variant/30">
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

                        <div className="md:col-span-2">
                            <InputLabel value="Especialidades" />
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                                {specialties.map((specialty) => (
                                    <label 
                                        key={specialty.id} 
                                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${data.specialties.includes(specialty.id) ? 'bg-primary/5 border-primary text-primary font-bold' : 'bg-surface-container-lowest border-outline-variant hover:border-primary/50'}`}
                                    >
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300 text-primary shadow-sm focus:ring-primary h-5 w-5"
                                            checked={data.specialties.includes(specialty.id)}
                                            onChange={() => toggleSpecialty(specialty.id)}
                                        />
                                        <span className="text-sm">{specialty.name}</span>
                                    </label>
                                ))}
                            </div>
                            <InputError message={errors.specialties} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="registration_number" value="Registro (Ex: CREFITO)" />
                            <TextInput
                                id="registration_number"
                                name="registration_number"
                                value={data.registration_number}
                                className="mt-1 block w-full"
                                onChange={(e) => setData('registration_number', e.target.value)}
                            />
                            <InputError message={errors.registration_number} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="email" value="E-mail de Contato" />
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
                    </div>

                    <div>
                        <InputLabel value="Cor de Identificação (Agenda)" />
                        <div className="flex flex-wrap gap-4 mt-3">
                            {colorOptions.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setData('color', option.value)}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${data.color === option.value ? 'ring-2 ring-primary ring-offset-2 scale-110' : 'hover:scale-105'}`}
                                    style={{ backgroundColor: option.value }}
                                    title={option.name}
                                >
                                    {data.color === option.value && (
                                        <span className="material-symbols-outlined text-white text-sm">check</span>
                                    )}
                                </button>
                            ))}
                        </div>
                        <InputError message={errors.color} className="mt-2" />
                    </div>

                    <div className="flex items-center justify-end mt-8 pt-6 border-t border-outline-variant/10">
                        <PrimaryButton className="px-10 py-3" disabled={processing}>
                            Salvar Alterações
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
