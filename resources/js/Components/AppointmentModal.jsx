import Modal from '@/Components/Modal';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
import { useForm, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { addMinutes, format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';

export default function AppointmentModal({ show, onClose, professionals, patients, specialties, packages, appointments = [], professionalHours, selectedDate, selectedProfessionalId, appointment = null, preselectedPatientId = null, preselectedHour = null }) {
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
        specialty_subgroup_id: '',
        package_id: '',
        patient_package_id: '',
        date: selectedDate || '',
        hour: '08:00',
        start_time: '',
        status: 'pendente',
        notes: '',
        repeat_days: [],
        repeat_weeks: 4,
    });

    const [availableHours, setAvailableHours] = useState([]);
    const [isProfessionalWorking, setIsProfessionalWorking] = useState(true);
    const [repeatEnabled, setRepeatEnabled] = useState(false);
    const [patientSearch, setPatientSearch] = useState('');
    const [showPatientSuggestions, setShowPatientSuggestions] = useState(false);
    const [siblings, setSiblings] = useState([]);
    const [deletingId, setDeletingId] = useState(null);
    const hasProfessionalAndDate = Boolean(data.professional_id) && Boolean(data.date);
    const selectedProfessional = professionals.find(p => String(p.id) === String(data.professional_id));
    const availableSpecialties = selectedProfessional?.specialties?.length
        ? specialties.filter(s => selectedProfessional.specialties.some(ps => ps.id === s.id))
        : specialties;
    const selectedSpecialty = specialties.find(s => String(s.id) === String(data.specialty_id));
    const isPilates = selectedSpecialty?.name?.toLowerCase().includes('pilates');
    const selectedSubgroup = selectedSpecialty?.subgroups?.find(sg => String(sg.id) === String(data.specialty_subgroup_id));
    const selectedDurationMinutes = Number(selectedSubgroup?.duration_minutes) || Number(selectedSpecialty?.duration_minutes) || 30;
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

            const buildSlots = (openTime, closeTime) => {
                const rawStart = parseTimeToMinutes(openTime);
                const close = parseTimeToMinutes(closeTime);
                const start = Number.isNaN(rawStart) ? rawStart : Math.ceil(rawStart / SLOT_INTERVAL_MINUTES) * SLOT_INTERVAL_MINUTES;
                const last  = close - selectedDurationMinutes;
                const result = [];
                if (!Number.isNaN(start) && !Number.isNaN(close) && start < close && last >= start) {
                    for (let m = start; m <= last; m += SLOT_INTERVAL_MINUTES) result.push(minutesToHour(m));
                }
                return result;
            };

            const slots = [
                ...buildSlots(config.open_time, config.close_time),
                ...(config.has_second_period && config.open_time_2 && config.close_time_2
                    ? buildSlots(config.open_time_2, config.close_time_2)
                    : []),
            ];

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
                    specialty_subgroup_id: appointment.specialty_subgroup_id || '',
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
                    professional_id: selectedProfessionalId && selectedProfessionalId !== 'all' ? String(selectedProfessionalId) : '',
                    patient_mode: 'registered',
                    patient_id: preselectedPatientId ? String(preselectedPatientId) : '',
                    walk_in_name: '',
                    walk_in_phone: '',
                    walk_in_email: '',
                    walk_in_birth_date: '',
                    walk_in_cpf: '',
                    specialty_id: '',
                    specialty_subgroup_id: '',
                    package_id: '',
                    patient_package_id: '',
                    date: selectedDate || '',
                    hour: preselectedHour || '08:00',
                    start_time: '',
                    status: 'pendente',
                    notes: '',
                    repeat_days: [],
                    repeat_weeks: 4,
                });
            }
            clearErrors();
            setRepeatEnabled(false);
            setShowPatientSuggestions(false);
            setSiblings(appointment?.repeat_siblings ?? []);
            setDeletingId(null);
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

    useEffect(() => {
        if (!repeatEnabled) {
            setData(d => ({ ...d, repeat_days: [], repeat_weeks: 4 }));
        }
    }, [repeatEnabled]);

    useEffect(() => {
        if (data.patient_id) {
            const p = patients.find(x => String(x.id) === String(data.patient_id));
            if (p) setPatientSearch(p.name);
        } else {
            setPatientSearch('');
        }
    }, [data.patient_id]);

    const filteredPackages = data.specialty_id
        ? packages.filter(pkg => String(pkg.specialty_id) === String(data.specialty_id))
        : [];

    const selectedPatient = patients.find(p => String(p.id) === String(data.patient_id));
    const patientPlans = selectedPatient?.packages?.filter(pp =>
        pp.package && String(pp.package.specialty_id) === String(data.specialty_id) && pp.status !== 'cancelled'
    ) ?? [];
    const selectedPatientPlan = patientPlans.find(pp => String(pp.id) === String(data.patient_package_id));

    const formatContractDate = (value) => {
        if (!value) return '';
        const raw = String(value).substring(0, 10);
        const parsed = parseISO(raw);
        if (Number.isNaN(parsed.getTime())) return raw;
        return format(parsed, 'dd/MM/yyyy');
    };

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
                onSuccess: () => { reset(); onClose(); },
            });
        } else {
            post(route('appointments.store'), {
                onSuccess: () => { reset(); onClose(); },
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

                        {data.patient_mode === 'registered' ? (
                            <div>
                                <div className="flex items-center justify-between">
                                    <InputLabel value="Pessoa" />
                                    {!appointment && (
                                        <a
                                            href={route('patients.create')}
                                            className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-sm">person_add</span>
                                            Cadastro rápido
                                        </a>
                                    )}
                                </div>
                                <div className="relative mt-1">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-[18px]">search</span>
                                    <input
                                        type="text"
                                        placeholder="Buscar pessoa por nome ou CPF..."
                                        className="w-full pl-9 pr-4 py-2 border border-stone-200 dark:border-stone-800 dark:bg-stone-900 rounded-xl shadow-sm focus:border-primary focus:ring-primary text-sm outline-none focus:ring-1"
                                        value={patientSearch}
                                        onChange={e => {
                                            setPatientSearch(e.target.value);
                                            setShowPatientSuggestions(true);
                                            if (!e.target.value) { setData('patient_id', ''); setData('patient_package_id', ''); }
                                        }}
                                        onFocus={() => setShowPatientSuggestions(true)}
                                        onBlur={() => setTimeout(() => setShowPatientSuggestions(false), 150)}
                                        autoComplete="off"
                                        required={data.patient_mode === 'registered'}
                                    />
                                    {showPatientSuggestions && patientSearch.trim().length >= 1 && (() => {
                                        const matches = patients.filter(p =>
                                            p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
                                            (p.cpf && p.cpf.includes(patientSearch))
                                        ).slice(0, 8);
                                        if (matches.length === 0) return null;
                                        return (
                                            <ul className="absolute z-50 mt-1 w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl shadow-lg overflow-hidden">
                                                {matches.map(p => (
                                                    <li key={p.id}>
                                                        <button
                                                            type="button"
                                                            onMouseDown={e => e.preventDefault()}
                                                            onClick={() => {
                                                                setData(d => ({ ...d, patient_id: String(p.id), patient_package_id: '' }));
                                                                setPatientSearch(p.name);
                                                                setShowPatientSuggestions(false);
                                                            }}
                                                            className="w-full text-left px-4 py-2.5 text-sm hover:bg-primary/5 flex items-center gap-2"
                                                        >
                                                            <span className="material-symbols-outlined text-base text-stone-400">person</span>
                                                            <div>
                                                                <div className="font-medium text-stone-800 dark:text-stone-200">{p.name}</div>
                                                                {p.cpf && <div className="text-xs text-stone-400">{p.cpf}</div>}
                                                            </div>
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        );
                                    })()}
                                </div>
                                <InputError message={errors.patient_id} className="mt-2" />
                            </div>
                        ) : (
                            <div>
                                <div className="flex items-center justify-between">
                                    <InputLabel value="Nome" />
                                    <button
                                        type="button"
                                        onClick={() => setData('patient_mode', 'registered')}
                                        className="flex items-center gap-1 text-xs font-semibold text-stone-500 hover:text-primary transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-sm">arrow_back</span>
                                        Buscar cadastro
                                    </button>
                                </div>
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

                        <div>
                            <InputLabel value="Profissional" />
                            <select
                                className="w-full mt-1 border-stone-200 dark:border-stone-800 dark:bg-stone-900 rounded-xl shadow-sm focus:border-primary focus:ring-primary"
                                value={data.professional_id}
                                onChange={(e) => {
                                    setData(d => ({ ...d, professional_id: e.target.value, specialty_id: '', package_id: '', patient_package_id: '' }));
                                }}
                                required
                            >
                                <option value="">Selecionar Profissional</option>
                                {professionals.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                            <InputError message={errors.professional_id} className="mt-2" />
                        </div>

                        {data.patient_mode === 'walk_in' && (
                            <>
                                <div>
                                    <InputLabel value="Telefone" />
                                    <TextInput
                                        className="w-full mt-1"
                                        value={data.walk_in_phone}
                                        onChange={(e) => setData('walk_in_phone', e.target.value)}
                                        placeholder="(00) 00000-0000"
                                        maxLength={15}
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
                                        maxLength={100}
                                    />
                                    <InputError message={errors.walk_in_email} className="mt-2" />
                                </div>
                                <div>
                                    <InputLabel value="CPF (opcional)" />
                                    <TextInput
                                        className="w-full mt-1"
                                        value={data.walk_in_cpf}
                                        onChange={(e) => setData('walk_in_cpf', e.target.value)}
                                        placeholder="000.000.000-00"
                                        maxLength={14}
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
                                    setData(d => ({ ...d, specialty_id: e.target.value, specialty_subgroup_id: '', package_id: '', patient_package_id: '' }));
                                }}
                                required
                            >
                                <option value="">Selecionar Especialidade</option>
                                {availableSpecialties.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                            <InputError message={errors.specialty_id} className="mt-2" />
                        </div>


                        {siblings.length > 0 && (
                            <div className="col-span-full rounded-2xl border border-primary/20 bg-primary/5 p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="material-symbols-outlined text-primary" style={{ fontSize: 18 }}>event_repeat</span>
                                    <span className="text-sm font-bold text-stone-700 dark:text-stone-200">Agendamentos da recorrência</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {siblings.map(s => {
                                        const d = new Date(s.start_time.replace(' ', 'T'));
                                        const isCurrent = s.id === appointment.id;
                                        const isDeleting = deletingId === s.id;
                                        const statusBg = {
                                            pendente:   'bg-yellow-50 border-yellow-200 text-yellow-700',
                                            confirmado: 'bg-blue-50 border-blue-200 text-blue-700',
                                            atendido:   'bg-green-50 border-green-200 text-green-700',
                                            cancelado:  'bg-red-50 border-red-200 text-red-400 line-through opacity-60',
                                        }[s.status] || 'bg-stone-100 border-stone-200 text-stone-500';

                                        return (
                                            <div
                                                key={s.id}
                                                className={`flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-xl text-xs font-bold border ${statusBg} ${isCurrent ? 'ring-2 ring-primary ring-offset-1' : ''}`}
                                            >
                                                <span>
                                                    {d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                                                    {' '}
                                                    {d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                {!isCurrent && s.status !== 'atendido' && (
                                                    <button
                                                        type="button"
                                                        disabled={isDeleting}
                                                        title="Remover este agendamento"
                                                        onClick={() => {
                                                            if (!confirm(`Remover agendamento de ${d.toLocaleDateString('pt-BR')}?`)) return;
                                                            setDeletingId(s.id);
                                                            router.delete(route('appointments.destroy', s.id), {
                                                                preserveScroll: true,
                                                                onSuccess: () => {
                                                                    setSiblings(prev => prev.filter(x => x.id !== s.id));
                                                                    setDeletingId(null);
                                                                },
                                                                onError: () => setDeletingId(null),
                                                            });
                                                        }}
                                                        className="ml-0.5 rounded-lg p-0.5 hover:bg-red-100 hover:text-red-600 transition-colors disabled:opacity-40"
                                                    >
                                                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                                                            {isDeleting ? 'hourglass_empty' : 'close'}
                                                        </span>
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

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

                    {data.specialty_id && !appointment && (
                        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-4">
                            {/* Contrato do paciente */}
                            <div>
                                <p className="text-xs font-semibold text-stone-500 mb-2 uppercase tracking-wide">Contrato</p>
                                <select
                                    className="w-full mt-1 border-stone-200 dark:border-stone-800 dark:bg-stone-900 rounded-xl shadow-sm focus:border-primary focus:ring-primary"
                                    value={data.patient_package_id}
                                    onChange={(e) => setData('patient_package_id', e.target.value)}
                                    disabled={!data.patient_id || patientPlans.length === 0}
                                >
                                    <option value="">
                                        {!data.patient_id
                                            ? 'Selecione um paciente primeiro'
                                            : patientPlans.length === 0
                                                ? 'Nenhum plano para esta especialidade'
                                                : 'Sem plano'}
                                    </option>
                                    {patientPlans.map(pp => (
                                        <option key={pp.id} value={String(pp.id)}>
                                            {`${pp.package.name} | Início: ${formatContractDate(pp.start_date)} | Término: ${pp.end_date ? formatContractDate(pp.end_date) : 'Sem término'}`}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.patient_package_id} className="mt-1" />

                                {selectedPatientPlan && (
                                    <div className="grid grid-cols-2 gap-3 mt-3">
                                        <div>
                                            <InputLabel value="Data de Início" />
                                            <TextInput
                                                type="date"
                                                className="w-full mt-1"
                                                value={selectedPatientPlan.start_date ? String(selectedPatientPlan.start_date).substring(0, 10) : ''}
                                                readOnly
                                            />
                                        </div>
                                        <div>
                                            <InputLabel value="Data de Término" />
                                            <TextInput
                                                type="date"
                                                className="w-full mt-1"
                                                value={selectedPatientPlan.end_date ? String(selectedPatientPlan.end_date).substring(0, 10) : ''}
                                                readOnly
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {isPilates && (<>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary" style={{ fontSize: 20 }}>event_repeat</span>
                                    <span className="font-bold text-stone-700 dark:text-stone-200 text-sm">Repetição semanal</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const next = !repeatEnabled;
                                        setRepeatEnabled(next);
                                        if (next && data.date) {
                                            const jsDay = new Date(data.date + 'T12:00:00').getDay();
                                            const isoDay = jsDay === 0 ? 7 : jsDay;
                                            setData('repeat_days', [isoDay]);
                                        }
                                    }}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${repeatEnabled ? 'bg-primary' : 'bg-stone-300'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${repeatEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>

                            {repeatEnabled && (
                                <>
                                    <div>
                                        <p className="text-xs font-semibold text-stone-500 mb-2 uppercase tracking-wide">Dias da semana</p>
                                        <div className="flex flex-wrap gap-2">
                                            {[
                                                { label: 'Seg', day: 1 },
                                                { label: 'Ter', day: 2 },
                                                { label: 'Qua', day: 3 },
                                                { label: 'Qui', day: 4 },
                                                { label: 'Sex', day: 5 },
                                                { label: 'Sáb', day: 6 },
                                            ].map(({ label, day }) => {
                                                const active = data.repeat_days.includes(day);
                                                return (
                                                    <button
                                                        key={day}
                                                        type="button"
                                                        onClick={() => setData('repeat_days',
                                                            active ? data.repeat_days.filter(d => d !== day) : [...data.repeat_days, day].sort()
                                                        )}
                                                        className={`px-3 py-1.5 rounded-xl text-sm font-bold transition-all ${active ? 'bg-primary text-white shadow-sm' : 'bg-white text-stone-500 border border-stone-200 hover:border-primary/40'}`}
                                                    >
                                                        {label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide whitespace-nowrap">Repetir por</p>
                                        <div className="flex gap-2">
                                            {[4, 8, 12].map(w => (
                                                <button
                                                    key={w}
                                                    type="button"
                                                    onClick={() => setData('repeat_weeks', w)}
                                                    className={`px-3 py-1.5 rounded-xl text-sm font-bold transition-all ${data.repeat_weeks === w ? 'bg-primary text-white shadow-sm' : 'bg-white text-stone-500 border border-stone-200 hover:border-primary/40'}`}
                                                >
                                                    {w} sem.
                                                </button>
                                            ))}
                                            <div className="flex items-center gap-1">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="52"
                                                    value={data.repeat_weeks}
                                                    onChange={e => setData('repeat_weeks', Number(e.target.value))}
                                                    className="w-16 border border-stone-200 rounded-xl px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white dark:bg-stone-800"
                                                />
                                                <span className="text-xs text-stone-400">sem.</span>
                                            </div>
                                        </div>
                                    </div>

                                    {data.repeat_days.length > 0 && (
                                        <p className="text-xs text-primary/70 font-medium">
                                            {data.repeat_days.length * data.repeat_weeks} agendamentos serão criados
                                        </p>
                                    )}
                                </>
                            )}
                            </>)}
                        </div>
                    )}

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
