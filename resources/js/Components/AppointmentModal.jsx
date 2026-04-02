import Modal from '@/Components/Modal';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export default function AppointmentModal({ show, onClose, professionals, patients, specialties, selectedDate, selectedProfessionalId }) {
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
                                className="mt-1 block w-full bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 rounded-xl text-sm focus:ring-primary focus:border-primary transition-all"
                                value={data.hour}
                                onChange={(e) => setData('hour', e.target.value)}
                                required
                            >
                                {hours.map(h => (
                                    <option key={h} value={h}>{h}</option>
                                ))}
                            </select>
                            <InputError message={errors.hour} className="mt-2" />
                        </div>
                    </div>

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
                    <PrimaryButton className="px-8" disabled={processing}>
                        Confirmar Agendamento
                    </PrimaryButton>
                </div>
            </form>
        </Modal>
    );
}
