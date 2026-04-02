import Modal from '@/Components/Modal';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';

export default function AppointmentModal({ show, onClose, professionals, patients, specialties, professionalHours, selectedDate, selectedProfessionalId }) {
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        professional_id: selectedProfessionalId || '',
        patient_id: '',
        specialty_id: '',
        date: selectedDate || '',
        hour: '08:00',
        notes: '',
    });

    const [duration, setDuration] = useState(0);
    const [availableHours, setAvailableHours] = useState([]);
    const [isProfessionalWorking, setIsProfessionalWorking] = useState(true);

    useEffect(() => {
        if (data.date && professionalHours) {
            const dayName = format(parseISO(data.date), 'EEEE', { locale: ptBR });
            const config = professionalHours.find(h => h.day_of_week === dayName);

            if (config && config.is_open) {
                setIsProfessionalWorking(true);
                const start = parseInt(config.open_time.split(':')[0]);
                const end = parseInt(config.close_time.split(':')[0]);
                
                const slots = [];
                for (let h = start; h < end; h++) {
                    const hourStr = h.toString().padStart(2, '0');
                    slots.push(`${hourStr}:00`);
                    slots.push(`${hourStr}:30`);
                }
                setAvailableHours(slots);
                if (!slots.includes(data.hour)) {
                    setData('hour', slots[0] || '08:00');
                }
            } else {
                setIsProfessionalWorking(false);
                setAvailableHours([]);
            }
        }
    }, [data.date, professionalHours]);

    useEffect(() => {
        if (show) {
            setData(d => ({
                ...d,
                professional_id: selectedProfessionalId || '',
                date: selectedDate || '',
            }));
            clearErrors();
        }
    }, [show, selectedDate, selectedProfessionalId]);

    useEffect(() => {
        if (data.specialty_id) {
            const spec = specialties.find(s => s.id == data.specialty_id);
            setDuration(spec ? spec.duration_minutes : 0);
        }
    }, [data.specialty_id, specialties]);

    const submit = (e) => {
        e.preventDefault();
        const start_time = `${data.date} ${data.hour}:00`;
        post(route('appointments.store', { ...data, start_time }), {
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    return (
        <Modal show={show} onClose={onClose} maxWidth="2xl">
            <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-black text-primary tracking-tight">Novo Agendamento</h2>
                    <button onClick={onClose} className="text-stone-400 hover:text-stone-600 transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {!isProfessionalWorking && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600">
                        <span className="material-symbols-outlined">warning</span>
                        <p className="text-xs font-bold uppercase tracking-wide">O profissional selecionado não atende nesta data.</p>
                    </div>
                )}

                <form onSubmit={submit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <InputLabel value="Profissional" />
                            <select 
                                className="w-full mt-1 border-stone-200 dark:border-stone-800 dark:bg-stone-900 rounded-xl shadow-sm focus:border-primary focus:ring-primary"
                                value={data.professional_id}
                                onChange={(e) => setData('professional_id', e.target.value)}
                                required
                            >
                                <option value="">Selecionar Profissional</option>
                                {professionals.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                            <InputError message={errors.professional_id} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel value="Paciente" />
                            <select 
                                className="w-full mt-1 border-stone-200 dark:border-stone-800 dark:bg-stone-900 rounded-xl shadow-sm focus:border-primary focus:ring-primary"
                                value={data.patient_id}
                                onChange={(e) => setData('patient_id', e.target.value)}
                                required
                            >
                                <option value="">Selecionar Paciente</option>
                                {patients.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                            <InputError message={errors.patient_id} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel value="Especialidade" />
                            <select 
                                className="w-full mt-1 border-stone-200 dark:border-stone-800 dark:bg-stone-900 rounded-xl shadow-sm focus:border-primary focus:ring-primary"
                                value={data.specialty_id}
                                onChange={(e) => setData('specialty_id', e.target.value)}
                                required
                            >
                                <option value="">Selecionar Especialidade</option>
                                {specialties.map(s => (
                                    <option key={s.id} value={s.id}>{s.name} ({s.duration_minutes} min)</option>
                                ))}
                            </select>
                            <InputError message={errors.specialty_id} className="mt-2" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <InputLabel value="Data" />
                                <TextInput 
                                    type="date"
                                    className="w-full mt-1"
                                    value={data.date}
                                    onChange={(e) => setData('date', e.target.value)}
                                    required
                                />
                                <InputError message={errors.date} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel value="Hora Início" />
                                <select 
                                    className="w-full mt-1 border-stone-200 dark:border-stone-800 dark:bg-stone-900 rounded-xl shadow-sm focus:border-primary focus:ring-primary"
                                    value={data.hour}
                                    disabled={!isProfessionalWorking}
                                    onChange={(e) => setData('hour', e.target.value)}
                                    required
                                >
                                    {availableHours.map(h => (
                                        <option key={h} value={h}>{h}</option>
                                    ))}
                                </select>
                                <InputError message={errors.hour} className="mt-2" />
                            </div>
                        </div>
                    </div>

                    <div>
                        <InputLabel value="Observações" />
                        <textarea 
                            className="w-full mt-1 border-stone-200 dark:border-stone-800 dark:bg-stone-900 rounded-xl shadow-sm focus:border-primary focus:ring-primary h-24"
                            value={data.notes}
                            onChange={(e) => setData('notes', e.target.value)}
                        ></textarea>
                        <InputError message={errors.notes} className="mt-2" />
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-6 border-t border-stone-100 dark:border-stone-800">
                        <SecondaryButton onClick={onClose} type="button">Cancelar</SecondaryButton>
                        <PrimaryButton className="px-8" disabled={processing || !isProfessionalWorking}>
                            {processing ? 'Salvando...' : 'Confirmar Agendamento'}
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </Modal>
    );
}
