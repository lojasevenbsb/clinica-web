import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import Checkbox from '@/Components/Checkbox';
import ProfessionalHoursForm from '@/Components/ProfessionalHoursForm';

export default function Edit({ professional, specialties }) {
    // Helper to ensure we have all 7 days even if new
    const days = [
        'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'
    ];

    const initialHours = days.map(day => {
        const existing = professional.hours.find(h => h.day_of_week === day);
        if (existing) {
            return {
                day_of_week: existing.day_of_week,
                is_open: !!existing.is_open,
                open_time: existing.open_time.substring(0, 5),
                close_time: existing.close_time.substring(0, 5),
            };
        }
        return { 
            day_of_week: day, 
            is_open: day !== 'Sábado' && day !== 'Domingo', 
            open_time: '08:00', 
            close_time: '18:00' 
        };
    });

    const { data, setData, patch, processing, errors } = useForm({
        name: professional.name,
        nickname: professional.nickname || '',
        registration_number: professional.registration_number || '',
        email: professional.email || '',
        phone: professional.phone || '',
        color: professional.color,
        specialties: professional.specialties.map(s => s.id),
        hours: initialHours
    });

    const submit = (e) => {
        e.preventDefault();
        patch(route('professionals.update', professional.id));
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Editar ${professional.name}`} />

            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-[#466250]">Editar Profissional</h1>
                    <p className="text-stone-500 text-sm">Atualize as informações e horários de {professional.name}.</p>
                </div>
                <Link href={route('professionals.index')} className="text-stone-500 hover:text-stone-800 transition-colors uppercase text-xs font-bold tracking-widest flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">arrow_back</span>
                    Voltar
                </Link>
            </div>

            <form onSubmit={submit} className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2 space-y-6">
                    {/* Basic Info */}
                    <div className="bg-white dark:bg-stone-900 rounded-3xl p-8 border border-stone-100 dark:border-stone-800 shadow-sm">
                        <h2 className="text-lg font-bold text-stone-800 mb-6 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">person</span>
                            Dados Básicos
                        </h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <InputLabel value="Nome Completo" />
                                <TextInput
                                    className="w-full mt-1"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    required
                                />
                                <InputError message={errors.name} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel value="Apelido" />
                                <TextInput
                                    className="w-full mt-1"
                                    value={data.nickname}
                                    onChange={(e) => setData('nickname', e.target.value)}
                                    placeholder="Como é chamado(a)"
                                />
                                <InputError message={errors.nickname} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel value="Registro Profissional (CRM/CRP)" />
                                <TextInput
                                    className="w-full mt-1"
                                    value={data.registration_number}
                                    onChange={(e) => setData('registration_number', e.target.value)}
                                />
                                <InputError message={errors.registration_number} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel value="Cor na Agenda" />
                                <div className="flex items-center gap-3 mt-1">
                                    <TextInput
                                        type="color"
                                        className="h-10 w-20 !p-1 cursor-pointer"
                                        value={data.color}
                                        onChange={(e) => setData('color', e.target.value)}
                                    />
                                    <span className="text-xs text-stone-500 font-medium uppercase">{data.color}</span>
                                </div>
                                <InputError message={errors.color} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel value="E-mail" />
                                <TextInput
                                    type="email"
                                    className="w-full mt-1"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                />
                                <InputError message={errors.email} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel value="Telefone" />
                                <TextInput
                                    className="w-full mt-1"
                                    value={data.phone}
                                    onChange={(e) => setData('phone', e.target.value)}
                                />
                                <InputError message={errors.phone} className="mt-2" />
                            </div>
                        </div>
                    </div>

                    {/* Specialties */}
                    <div className="bg-white dark:bg-stone-900 rounded-3xl p-8 border border-stone-100 dark:border-stone-800 shadow-sm">
                        <h2 className="text-lg font-bold text-stone-800 mb-6 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">psychology</span>
                            Especialidades
                        </h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {specialties.map(specialty => (
                                <label key={specialty.id} className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${data.specialties.includes(specialty.id) ? 'bg-primary/5 border-primary/30 ring-1 ring-primary/20' : 'bg-stone-50 border-stone-100 hover:border-stone-200'}`}>
                                    <Checkbox
                                        checked={data.specialties.includes(specialty.id)}
                                        onChange={(e) => {
                                            const val = specialty.id;
                                            setData('specialties', e.target.checked 
                                                ? [...data.specialties, val]
                                                : data.specialties.filter(v => v !== val)
                                            );
                                        }}
                                    />
                                    <span className={`text-sm font-bold ${data.specialties.includes(specialty.id) ? 'text-primary' : 'text-stone-600'}`}>
                                        {specialty.name}
                                    </span>
                                </label>
                            ))}
                        </div>
                        <InputError message={errors.specialties} className="mt-2" />
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Working Hours */}
                    <div className="bg-white dark:bg-stone-900 rounded-3xl p-8 border border-stone-100 dark:border-stone-800 shadow-sm">
                        <h2 className="text-lg font-bold text-stone-800 mb-6 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">schedule</span>
                            Horários de Atendimento
                        </h2>
                        <ProfessionalHoursForm 
                            hours={data.hours}
                            onChange={(newHours) => setData('hours', newHours)}
                        />
                        <InputError message={errors.hours} className="mt-2" />
                    </div>

                    {/* Actions */}
                    <div className="bg-[#466250] rounded-3xl p-8 text-white shadow-xl shadow-primary/20">
                        <h3 className="font-bold mb-2">Salvar Alterações</h3>
                        <p className="text-white/70 text-sm mb-6">As alterações de horário impactarão as novas disponibilidades na agenda.</p>
                        
                        <PrimaryButton className="w-full !bg-white !text-[#466250] !py-4 flex justify-center !rounded-2xl shadow-lg" disabled={processing}>
                            {processing ? 'Salvando...' : 'Atualizar Profissional'}
                        </PrimaryButton>
                    </div>
                </div>
            </form>
        </AuthenticatedLayout>
    );
}
