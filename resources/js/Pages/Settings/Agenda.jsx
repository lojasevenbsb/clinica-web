import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SettingsLayout from '@/Layouts/SettingsLayout';
import { Head, useForm } from '@inertiajs/react';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import Checkbox from '@/Components/Checkbox';

export default function Agenda({ clinicHours }) {
    const { data, setData, post, processing, errors } = useForm({
        hours: clinicHours.map(h => ({
            id: h.id,
            day_of_week: h.day_of_week,
            is_open: h.is_open,
            open_time: h.open_time.substring(0, 5),
            close_time: h.close_time.substring(0, 5),
        }))
    });

    const handleToggle = (index) => {
        const newHours = [...data.hours];
        newHours[index].is_open = !newHours[index].is_open;
        setData('hours', newHours);
    };

    const handleChange = (index, field, value) => {
        const newHours = [...data.hours];
        newHours[index][field] = value;
        setData('hours', newHours);
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('settings.agenda.update'));
    };

    return (
        <AuthenticatedLayout>
            <Head title="Configurações da Agenda" />

            <SettingsLayout 
                title="Configurações da Agenda" 
                subtitle="Defina os dias e horários de funcionamento da clínica para a agenda."
            >
                <div className="max-w-4xl bg-white dark:bg-stone-900 rounded-3xl p-8 shadow-sm border border-stone-200 dark:border-stone-800">
                    <form onSubmit={submit} className="space-y-6">
                        <div className="divide-y divide-stone-100 dark:divide-stone-800">
                            {data.hours.map((hour, index) => (
                                <div key={hour.id} className="py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 first:pt-0">
                                    <div className="flex items-center gap-4 min-w-[180px]">
                                        <Checkbox
                                            checked={hour.is_open}
                                            onChange={() => handleToggle(index)}
                                        />
                                        <span className={`font-bold ${hour.is_open ? 'text-stone-900' : 'text-stone-400'}`}>
                                            {hour.day_of_week}
                                        </span>
                                    </div>

                                    <div className={`flex items-center gap-4 transition-opacity ${hour.is_open ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-stone-400 font-bold uppercase">Abre</span>
                                            <TextInput
                                                type="time"
                                                value={hour.open_time}
                                                onChange={(e) => handleChange(index, 'open_time', e.target.value)}
                                                className="w-32"
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-stone-400 font-bold uppercase">Fecha</span>
                                            <TextInput
                                                type="time"
                                                value={hour.close_time}
                                                onChange={(e) => handleChange(index, 'close_time', e.target.value)}
                                                className="w-32"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="text-right min-w-[100px]">
                                        {!hour.is_open && (
                                            <span className="text-xs font-extrabold text-red-400 uppercase tracking-widest bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded-full">
                                                Fechado
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center justify-end mt-8 pt-6 border-t border-stone-100 dark:border-stone-800">
                            <PrimaryButton className="px-12 py-3.5" disabled={processing}>
                                Salvar Alterações
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </SettingsLayout>
        </AuthenticatedLayout>
    );
}
