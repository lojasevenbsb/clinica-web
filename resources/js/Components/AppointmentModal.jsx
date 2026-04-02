import Modal from '@/Components/Modal';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export default function AppointmentModal({ show, onClose, professionals, patients, specialties, clinicHours, selectedDate, selectedProfessionalId }) {
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        professional_id: selectedProfessionalId || '',
        patient_id: '',
        specialty_id: '',
        date: selectedDate || '',
        hour: '07:00',
        start_time: '',
        notes: '',
    });

    const [duration, setDuration] = useState(0);
    const [availableHours, setAvailableHours] = useState([]);
    const [isClinicOpen, setIsClinicOpen] = useState(true);

    const getDayNameInPortuguese = (dateString) => {
        const date = new Date(dateString + 'T00:00:00');
        const dayNames = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
        return dayNames[date.getDay()];
    };

    useEffect(() => {
        if (data.date && clinicHours) {
            const dayName = getDayNameInPortuguese(data.date);
            const config = clinicHours.find(h => h.day_of_week === dayName);
            
            if (config && config.is_open) {
                setIsClinicOpen(true);
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
                    setData('hour', slots[0] || '07:00');
                }
            } else {
                setIsClinicOpen(false);
                setAvailableHours([]);
            }
        }
    }, [data.date, clinicHours]);

    useEffect(() => {
        if (show) {
            setData({
                ...data,
                professional_id: selectedProfessionalId || '',
                date: selectedDate || '',
            });
            clearErrors();
        }
    }, [show, selectedDate, selectedProfessionalId]);

    useEffect(() => {
        if (data.date && data.hour) {
            setData('start_time', `${data.date} ${data.hour}:00`);
        }
    }, [data.date, data.hour]);

    useEffect(() => {
        if (data.specialty_id) {
            const spec = specialties.find(s => s.id == data.specialty_id);
            setDuration(spec ? spec.duration_minutes : 0);
        }
    }, [data.specialty_id, specialties]);

    const submit = (e) => {
        e.preventDefault();
        post(route('appointments.store'), {
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    const hours = [];
    for (let h = 7; h <= 21; h++) {
        const hourStr = h.toString().padStart(2, '0');
        hours.push(`${hourStr}:00`);
        hours.push(`${hourStr}:30`);
    }

    return (
        <Modal show={show} onClose={onClose} maxWidth="lg">
            <form onSubmit={submit} className="p-8">
                <div className="flex items-center gap-4 text-primary mb-6">
                    <span className="material-symbols-outlined text-4xl">calendar_add_on</span>
                    <div>
                        <h2 className="text-xl font-bold">Novo Agendamento</h2>
                        <p className="text-stone-500 text-sm">Preencha os dados do atendimento físico.</p>
                    </div>
                </div>

                <div className="space-y-5">
                    <div>
                        <InputLabel htmlFor="professional_id" value="Profissional" />
                        <select
                            id="professional_id"
                            className="mt-1 block w-full bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 rounded-xl text-sm focus:ring-primary focus:border-primary transition-all"
                            value={data.professional_id}
                            onChange={(e) => setData('professional_id', e.target.value)}
                            required
                        >
                            <option value="">Selecione um profissional</option>
                            {professionals.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                        <InputError message={errors.professional_id} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="patient_id" value="Paciente" />
                        <select
                            id="patient_id"
                            className="mt-1 block w-full bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 rounded-xl text-sm focus:ring-primary focus:border-primary transition-all"
                            value={data.patient_id}
                            onChange={(e) => setData('patient_id', e.target.value)}
                            required
                        >
                            <option value="">Selecione um paciente</option>
                            {patients.map(p => (
                                <option key={p.id} value={p.id}>{p.name} - {p.cpf}</option>
                            ))}
                        </select>
                        <InputError message={errors.patient_id} className="mt-2" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <InputLabel htmlFor="specialty_id" value="Especialidade" />
                            <select
                                id="specialty_id"
                                className="mt-1 block w-full bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 rounded-xl text-sm focus:ring-primary focus:border-primary transition-all"
                                value={data.specialty_id}
                                onChange={(e) => setData('specialty_id', e.target.value)}
                                required
                            >
                                <option value="">Selecione...</option>
                                {specialties.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                            {duration > 0 && <p className="text-[10px] text-primary font-bold mt-1 uppercase tracking-wider">Duração: {duration} min</p>}
                            <InputError message={errors.specialty_id} className="mt-2" />
                        </div>

                        <div>
                            <InputLabel htmlFor="hour" value="Horário de Início" />
                            <select
                                id="hour"
                                className={`mt-1 block w-full bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 rounded-xl text-sm focus:ring-primary focus:border-primary transition-all ${!isClinicOpen ? 'opacity-50 pointer-events-none' : ''}`}
                                value={data.hour}
                                onChange={(e) => setData('hour', e.target.value)}
                                required
                                disabled={!isClinicOpen}
                            >
                                {availableHours.length > 0 ? (
                                    availableHours.map(h => (
                                        <option key={h} value={h}>{h}</option>
                                    ))
                                ) : (
                                    <option value="">Indisponível</option>
                                )}
                            </select>
                            <InputError message={errors.hour} className="mt-2" />
                        </div>
                    </div>

                    {!isClinicOpen && (
                        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 p-4 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400">
                            <span className="material-symbols-outlined text-xl">block</span>
                            <p className="text-xs font-bold uppercase tracking-wider">A clínica está fechada nesta data.</p>
                        </div>
                    )}

                    <div>
                        <InputLabel htmlFor="notes" value="Observações (Opcional)" />
                        <textarea
                            id="notes"
                            className="mt-1 block w-full bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 rounded-xl text-sm focus:ring-primary focus:border-primary transition-all min-h-[80px]"
                            value={data.notes}
                            onChange={(e) => setData('notes', e.target.value)}
                            placeholder="Alguma recomendação específica?"
                        />
                        <InputError message={errors.notes} className="mt-2" />
                    </div>
                </div>

                <div className="flex items-center justify-end mt-8 gap-3 pt-6 border-t border-stone-100 dark:border-stone-800">
                    <SecondaryButton onClick={onClose} type="button">Cancelar</SecondaryButton>
                    <PrimaryButton className="px-8" disabled={processing || !isClinicOpen}>
                        Confirmar Agendamento
                    </PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}
