import Modal from '@/Components/Modal';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { addMinutes, format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';

export default function AppointmentModal({ show, onClose, professionals, patients, specialties, packages, appointments = [], professionalHours, selectedDate, selectedProfessionalId, appointment = null }) {
    const { data, setData, post, patch, processing, errors, reset, clearErrors } = useForm({
        professional_id: selectedProfessionalId && selectedProfessionalId !== 'all' ? selectedProfessionalId : '',
        patient_mode: 'registered',
        patient_id: '',
        walk_in_name: '',
        walk_in_phone: '',
        walk_in_email: '',
        walk_in_birth_date: '',
        walk_in_cpf: '',
        specialty_id: '',
        package_id: '',
        patient_package_id: '',
        date: selectedDate || '',
        hour: '08:00',
        start_time: '',
        status: 'pendente',
        notes: '',
    });

    const [availableHours, setAvailableHours] = useState([]);
    const [isProfessionalWorking, setIsProfessionalWorking] = useState(true);
    const hasProfessionalAndDate = Boolean(data.professional_id) && Boolean(data.date);
    const selectedSpecialty = specialties.find(s => String(s.id) === String(data.specialty_id));
    const selectedDurationMinutes = Number(selectedSpecialty?.duration_minutes) || 30;
    const SLOT_INTERVAL_MINUTES = 30;

    const parseTimeToMinutes = (value) => {
        if (!value) return Number.NaN;

        const [hourPart, minutePart] = String(value).split(':');
        const hours = Number.parseInt(hourPart, 10);
        const minutes = Number.parseInt(minutePart, 10);

        if (Number.isNaN(hours) || Number.isNaN(minutes)) return Number.NaN;
        return (hours * 60) + minutes;
    };

    const minutesToHour = (totalMinutes) => {
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        if (!data.date || !data.professional_id || data.professional_id === 'all') {
            setIsProfessionalWorking(false);
            setAvailableHours([]);
            return;
        }

        const dayName = format(parseISO(data.date), 'EEEE', { locale: ptBR }).toLowerCase();
        const selectedProfessional = professionals.find((p) => String(p.id) === String(data.professional_id));
        const selectedProfessionalHours = selectedProfessional?.hours || professionalHours || [];
        const config = selectedProfessionalHours.find(
            (h) => String(h.day_of_week || '').toLowerCase() === dayName
        );

        if (config && config.is_open) {
            setIsProfessionalWorking(true);
            const startMinutes = parseTimeToMinutes(config.open_time);
            const closeMinutes = parseTimeToMinutes(config.close_time);
            const lastPossibleStart = closeMinutes - selectedDurationMinutes;

            const slots = [];
            if (
                !Number.isNaN(startMinutes)
                && !Number.isNaN(closeMinutes)
                && startMinutes < closeMinutes
                && lastPossibleStart >= startMinutes
            ) {
                for (let minute = startMinutes; minute <= lastPossibleStart; minute += SLOT_INTERVAL_MINUTES) {
                    slots.push(minutesToHour(minute));
                }
            }

            if (appointment && data.hour && !slots.includes(data.hour)) {
                slots.unshift(data.hour);
            }

            setAvailableHours(slots);

            // Only reset the hour if it's not in the slots AND we are not initializing for an edit
            if (!slots.includes(data.hour) && !appointment) {
                setData('hour', slots[0] || '');
            }
        } else {
            setIsProfessionalWorking(false);
            setAvailableHours([]);
        }
    }, [data.date, data.professional_id, professionals, professionalHours, selectedDurationMinutes, appointment]);

    useEffect(() => {
        if (show) {
            if (appointment) {
                const startDateTime = parseISO(appointment.start_time);
                setData({
                    professional_id: appointment.professional_id,
                    patient_mode: 'registered',
                    patient_id: appointment.patient_id,
                    walk_in_name: '',
                    walk_in_phone: '',
                    walk_in_email: '',
                    walk_in_birth_date: '',
                    walk_in_cpf: '',
                    specialty_id: appointment.specialty_id,
                    package_id: appointment.patient_package?.package_id || '',
                    patient_package_id: appointment.patient_package_id || '',
                    date: format(startDateTime, 'yyyy-MM-dd'),
                    hour: format(startDateTime, 'HH:mm'),
                    start_time: format(startDateTime, 'yyyy-MM-dd HH:mm:ss'),
                    status: appointment.status,
                    notes: appointment.notes || '',
                });
            } else {
                setData({
                    professional_id: selectedProfessionalId && selectedProfessionalId !== 'all' ? selectedProfessionalId : '',
                    patient_mode: 'registered',
                    patient_id: '',
                    walk_in_name: '',
                    walk_in_phone: '',
                    walk_in_email: '',
                    walk_in_birth_date: '',
                    walk_in_cpf: '',
                    specialty_id: '',
                    package_id: '',
                    patient_package_id: '',
                    date: selectedDate || '',
                    hour: '08:00',
                    start_time: '',
                    status: 'pendente',
                    notes: '',
                });
            }
            clearErrors();
        }
    }, [show, appointment, selectedDate, selectedProfessionalId]);

    useEffect(() => {
        if (data.date && data.hour) {
            setData('start_time', `${data.date} ${data.hour}:00`);
        }
    }, [data.date, data.hour]);

    useEffect(() => {
        if (data.patient_mode === 'walk_in') {
            setData('patient_id', '');
            return;
        }

        setData('walk_in_name', '');
        setData('walk_in_phone', '');
        setData('walk_in_email', '');
        setData('walk_in_birth_date', '');
        setData('walk_in_cpf', '');
    }, [data.patient_mode]);

    const filteredPackages = data.specialty_id
        ? packages.filter(pkg => String(pkg.specialty_id) === String(data.specialty_id))
        : [];

    const parseServerDateTime = (value) => {
        if (!value) return null;
        const normalized = String(value).replace(' ', 'T');
        return parseISO(normalized);
    };

    const isHourOccupied = (hour) => {
        if (!data.professional_id || !data.date) return false;
        if (data.professional_id === 'all') return false;

        const slotStart = parseISO(`${data.date}T${hour}:00`);
        const slotEnd = addMinutes(slotStart, selectedDurationMinutes);

        return appointments.some((appt) => {
            if (appointment && appt.id === appointment.id) return false;
            if (String(appt.professional_id) !== String(data.professional_id)) return false;
            if (appt.status === 'cancelado') return false;

            const apptStart = parseServerDateTime(appt.start_time);
            if (!apptStart || Number.isNaN(apptStart.getTime())) return false;

            const apptEndRaw = parseServerDateTime(appt.end_time);
            const apptEnd = apptEndRaw && !Number.isNaN(apptEndRaw.getTime())
                ? apptEndRaw
                : addMinutes(apptStart, 30);

            return slotStart < apptEnd && slotEnd > apptStart;
        });
    };

    const submit = (e) => {
        e.preventDefault();

        if (appointment) {
            patch(route('appointments.update', appointment.id), {
                onSuccess: () => {
                    reset();
                    onClose();
                },
            });
        } else {
            post(route('appointments.store'), {
                onSuccess: () => {
                    reset();
                    onClose();
                },
            });
        }
    };

    return (
        <Modal show={show} onClose={onClose} maxWidth="2xl">
            <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-black text-primary tracking-tight">
                        {appointment ? 'Editar Agendamento' : 'Novo Agendamento'}
                    </h2>
                    <button onClick={onClose} type="button" className="text-stone-400 hover:text-stone-600 transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {hasProfessionalAndDate && !isProfessionalWorking && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600">
                        <span className="material-symbols-outlined">warning</span>
                        <p className="text-xs font-bold uppercase tracking-wide">O profissional selecionado não atende nesta data.</p>
                    </div>
                )}

                {(errors.hour || errors.start_time) && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600">
                        <span className="material-symbols-outlined">error</span>
                        <p className="text-sm font-bold">{errors.hour || errors.start_time}</p>
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

                        {!appointment && (
                            <div>
                                <InputLabel value="Tipo de Paciente" />
                                <select
                                    className="w-full mt-1 border-stone-200 dark:border-stone-800 dark:bg-stone-900 rounded-xl shadow-sm focus:border-primary focus:ring-primary"
                                    value={data.patient_mode}
                                    onChange={(e) => setData('patient_mode', e.target.value)}
                                >
                                    <option value="registered">Paciente cadastrado</option>
                                    <option value="walk_in">Paciente avulso (cadastro rápido)</option>
                                </select>
                            </div>
                        )}

                        {data.patient_mode === 'registered' ? (
                            <div>
                                <InputLabel value="Paciente" />
                                <select
                                    className="w-full mt-1 border-stone-200 dark:border-stone-800 dark:bg-stone-900 rounded-xl shadow-sm focus:border-primary focus:ring-primary"
                                    value={data.patient_id}
                                    onChange={(e) => {
                                        setData('patient_id', e.target.value);
                                        setData('patient_package_id', '');
                                    }}
                                    required={data.patient_mode === 'registered'}
                                >
                                    <option value="">Selecionar Paciente</option>
                                    {patients.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                                <InputError message={errors.patient_id} className="mt-2" />
                            </div>
                        ) : (
                            <div>
                                <InputLabel value="Nome do Paciente" />
                                <TextInput
                                    className="w-full mt-1"
                                    value={data.walk_in_name}
                                    onChange={(e) => setData('walk_in_name', e.target.value)}
                                    placeholder="Nome completo"
                                    required={data.patient_mode === 'walk_in'}
                                />
                                <InputError message={errors.walk_in_name} className="mt-2" />
                            </div>
                        )}

                        {data.patient_mode === 'walk_in' && (
                            <>
                                <div>
                                    <InputLabel value="Telefone" />
                                    <TextInput
                                        className="w-full mt-1"
                                        value={data.walk_in_phone}
                                        onChange={(e) => setData('walk_in_phone', e.target.value)}
                                        placeholder="(00) 00000-0000"
                                    />
                                    <InputError message={errors.walk_in_phone} className="mt-2" />
                                </div>
                                <div>
                                    <InputLabel value="Email" />
                                    <TextInput
                                        type="email"
                                        className="w-full mt-1"
                                        value={data.walk_in_email}
                                        onChange={(e) => setData('walk_in_email', e.target.value)}
                                        placeholder="email@exemplo.com"
                                    />
                                    <InputError message={errors.walk_in_email} className="mt-2" />
                                </div>
                                <div>
                                    <InputLabel value="CPF (opcional)" />
                                    <TextInput
                                        className="w-full mt-1"
                                        value={data.walk_in_cpf}
                                        onChange={(e) => setData('walk_in_cpf', e.target.value)}
                                        placeholder="Somente números ou formato livre"
                                    />
                                    <InputError message={errors.walk_in_cpf} className="mt-2" />
                                </div>
                                <div>
                                    <InputLabel value="Nascimento (opcional)" />
                                    <TextInput
                                        type="date"
                                        className="w-full mt-1"
                                        value={data.walk_in_birth_date}
                                        onChange={(e) => setData('walk_in_birth_date', e.target.value)}
                                    />
                                    <InputError message={errors.walk_in_birth_date} className="mt-2" />
                                </div>
                            </>
                        )}

                        <div>
                            <InputLabel value="Especialidade" />
                            <select 
                                className="w-full mt-1 border-stone-200 dark:border-stone-800 dark:bg-stone-900 rounded-xl shadow-sm focus:border-primary focus:ring-primary"
                                value={data.specialty_id}
                                onChange={(e) => {
                                    setData('specialty_id', e.target.value);
                                    setData('package_id', '');
                                    setData('patient_package_id', '');
                                }}
                                required
                            >
                                <option value="">Selecionar Especialidade</option>
                                {specialties.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                            <InputError message={errors.specialty_id} className="mt-2" />
                        </div>

                        {/* Plano da especialidade */}
                        <div>
                            <InputLabel value="Plano" />
                            <select
                                className="w-full mt-1 border-stone-200 dark:border-stone-800 dark:bg-stone-900 rounded-xl shadow-sm focus:border-primary focus:ring-primary disabled:opacity-50"
                                value={data.package_id}
                                onChange={(e) => {
                                    setData('package_id', e.target.value);
                                    setData('patient_package_id', '');
                                }}
                                disabled={!data.specialty_id || filteredPackages.length === 0}
                            >
                                <option value="">
                                    {!data.specialty_id
                                        ? 'Selecione a especialidade primeiro'
                                        : filteredPackages.length === 0
                                            ? 'Sem planos para esta especialidade'
                                            : 'Nenhum plano (particular)'}
                                </option>
                                {filteredPackages.map(pkg => (
                                    <option key={pkg.id} value={pkg.id}>{pkg.name}</option>
                                ))}
                            </select>
                            <InputError message={errors.package_id} className="mt-2" />
                        </div>

                        {appointment && (
                            <div>
                                <InputLabel value="Status" />
                                <select 
                                    className="w-full mt-1 border-stone-200 dark:border-stone-800 dark:bg-stone-900 rounded-xl shadow-sm focus:border-primary focus:ring-primary"
                                    value={data.status}
                                    onChange={(e) => setData('status', e.target.value)}
                                    required
                                >
                                    <option value="pendente">Pendente</option>
                                    <option value="confirmado">Confirmado</option>
                                    <option value="cancelado">Cancelado</option>
                                    <option value="atendido">Atendido</option>
                                </select>
                                <InputError message={errors.status} className="mt-2" />
                            </div>
                        )}

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
                                    disabled={!isProfessionalWorking || availableHours.length === 0}
                                    onChange={(e) => setData('hour', e.target.value)}
                                    required
                                >
                                    {availableHours.length === 0 && (
                                        <option value="">Sem horários disponíveis</option>
                                    )}
                                    {availableHours.map(h => (
                                        <option key={h} value={h}>
                                            {h}
                                        </option>
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
                        <PrimaryButton
                            className="px-8"
                            disabled={processing || (hasProfessionalAndDate && !isProfessionalWorking)}
                        >
                            {processing ? 'Salvando...' : (appointment ? 'Atualizar Agendamento' : 'Confirmar Agendamento')}
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </Modal>
    );
}
