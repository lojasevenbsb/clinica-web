import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState, useMemo, useRef, useEffect } from 'react';
import AppointmentModal from '@/Components/AppointmentModal';
import { format, addDays, subDays, startOfWeek, isSameDay, parseISO, startOfMonth, endOfMonth, addMonths, subMonths, getDaysInMonth, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';

/* ─────────────────────────────────────────
   Status helper
───────────────────────────────────────── */
function statusStyle(status) {
    switch (status) {
        case 'confirmado': return { label: 'Confirmado', bg: 'bg-emerald-500', text: 'text-white' };
        case 'cancelado':  return { label: 'Cancelado',  bg: 'bg-red-500',     text: 'text-white' };
        case 'atendido':   return { label: 'Atendido',   bg: 'bg-blue-500',    text: 'text-white' };
        default:           return { label: 'Pendente',   bg: 'bg-amber-400',   text: 'text-white' };
    }
}

/* ─────────────────────────────────────────
   Monthly Calendar Component
───────────────────────────────────────── */
function MonthCalendar({ selectedDate, monthAppointments, onDayClick, onPrevMonth, onNextMonth, onNewAppointment }) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const year  = selectedDate.getFullYear();
    const month = selectedDate.getMonth();

    const firstDay    = new Date(year, month, 1);
    const totalDays   = getDaysInMonth(firstDay);
    const startOffset = (getDay(firstDay) + 6) % 7; // Mon=0

    const cells = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= totalDays; d++) cells.push(new Date(year, month, d));
    while (cells.length % 7 !== 0) cells.push(null);

    const byDate = {};
    monthAppointments.forEach(app => {
        const key = app.start_time.substring(0, 10);
        if (!byDate[key]) byDate[key] = [];
        byDate[key].push(app);
    });

    const weekLabels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

    return (
        <section className="mt-4 bg-white border border-outline-variant/30 rounded-2xl overflow-hidden shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/30 bg-surface-container-lowest">
                <button onClick={onPrevMonth} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-container text-outline transition-colors">
                    <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <h2 className="text-base font-extrabold text-primary capitalize">
                    {format(firstDay, "MMMM 'de' yyyy", { locale: ptBR })}
                </h2>
                <button onClick={onNextMonth} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-container text-outline transition-colors">
                    <span className="material-symbols-outlined">chevron_right</span>
                </button>
            </div>

            {/* Week-day labels */}
            <div className="grid grid-cols-7 border-b border-outline-variant/20">
                {weekLabels.map(d => (
                    <div key={d} className="py-2 text-center text-[11px] font-bold text-outline uppercase tracking-widest">{d}</div>
                ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 divide-x divide-y divide-outline-variant/20">
                {cells.map((day, i) => {
                    if (!day) return <div key={`empty-${i}`} className="min-h-[100px] bg-stone-50/50" />;

                    const key        = format(day, 'yyyy-MM-dd');
                    const apps       = byDate[key] ?? [];
                    const isToday    = isSameDay(day, today);
                    const isSelected = isSameDay(day, selectedDate);
                    const visible    = apps.slice(0, 3);
                    const extra      = apps.length - visible.length;

                    return (
                        <div key={key} onClick={() => onDayClick(day)}
                            className={`min-h-[100px] p-2 cursor-pointer transition-colors flex flex-col gap-1 group ${isSelected ? 'bg-primary/5' : 'hover:bg-surface-container-low/60'}`}
                        >
                            <span className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-extrabold self-start
                                ${isToday ? 'bg-primary text-on-primary' : isSelected ? 'bg-primary/20 text-primary' : 'text-on-surface-variant group-hover:text-primary'}`}>
                                {day.getDate()}
                            </span>
                            {visible.map(app => (
                                <div key={app.id}
                                    className="flex items-center gap-1 text-[10px] font-medium rounded-md px-1.5 py-0.5 truncate"
                                    style={{ backgroundColor: (app.specialty?.color || '#6366f1') + '20', color: app.specialty?.color || '#6366f1' }}
                                    title={`${app.patient?.name} — ${app.start_time.substring(11, 16)}`}
                                >
                                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: app.specialty?.color || '#6366f1' }} />
                                    <span className="truncate">{app.patient?.name}</span>
                                    <span className="flex-shrink-0 opacity-60">{app.start_time.substring(11, 16)}</span>
                                </div>
                            ))}
                            {extra > 0 && <span className="text-[10px] text-primary font-bold pl-1">+{extra} mais</span>}
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 px-6 py-3 border-t border-outline-variant/20 bg-stone-50/50">
                <button onClick={onNewAppointment} className="ml-auto flex items-center gap-1.5 text-[11px] font-bold text-primary hover:underline">
                    <span className="material-symbols-outlined text-sm">add_circle</span>
                    Novo agendamento
                </button>
            </div>
        </section>
    );
}

/* ─────────────────────────────────────────
   All Professionals Grid (day view)
───────────────────────────────────────── */
function AllProfessionalsGrid({ allProfessionalsHours, appointments, selectedDate, onNewAppointment, onSlotClick, onEditAppointment, onDeleteAppointment, slotInterval }) {
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 30000);
        return () => clearInterval(id);
    }, []);

    const workingProfs = allProfessionalsHours;

    if (workingProfs.length === 0) {
        return (
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-12 flex flex-col items-center text-center gap-4 mt-4">
                <span className="material-symbols-outlined text-4xl text-stone-400">event_busy</span>
                <div>
                    <h2 className="text-xl font-bold text-stone-900">Nenhum Profissional Disponível</h2>
                    <p className="text-stone-500">Nenhum profissional realiza atendimentos neste dia.</p>
                </div>
            </div>
        );
    }

    const openProfs = workingProfs.filter(p => p.day_hours?.is_open);
    const startHour = openProfs.length > 0 ? Math.min(...openProfs.map(p => parseInt(p.day_hours.open_time.split(':')[0]))) : 8;
    const endHour   = openProfs.length > 0 ? Math.max(...openProfs.map(p => parseInt(p.day_hours.close_time.split(':')[0]))) : 18;

    // Generate slots based on slotInterval (in minutes)
    const slots = [];
    const totalMinutes = (endHour - startHour) * 60;
    for (let m = 0; m < totalMinutes; m += slotInterval) {
        const absMin = startHour * 60 + m;
        slots.push({ hour: Math.floor(absMin / 60), minute: absMin % 60 });
    }

    const SLOT_HEIGHT = slotInterval === 60 ? 90 : slotInterval === 30 ? 50 : 30; // px per slot

    const appsByProfSlot = {};
    appointments.forEach(app => {
        const dt  = parseISO(app.start_time);
        const h   = dt.getHours();
        const m   = dt.getMinutes();
        const slotMin = Math.floor(m / slotInterval) * slotInterval;
        const key = `${app.professional_id}-${h}-${slotMin}`;
        if (!appsByProfSlot[key]) appsByProfSlot[key] = [];
        appsByProfSlot[key].push(app);
    });

    const isToday   = isSameDay(parseISO(selectedDate), new Date());
    const nowH      = now.getHours();
    const nowM      = now.getMinutes();
    const nowTotalMin = (nowH - startHour) * 60 + nowM;
    const timeBarTop = (isToday && nowH >= startHour && nowH < endHour)
        ? (nowTotalMin / slotInterval) * SLOT_HEIGHT
        : null;

    return (
        <div className="mt-4 bg-surface-container-lowest border border-outline-variant/30 rounded-2xl overflow-hidden shadow-sm">
            {/* Header row — professional names */}
            <div className="flex border-b-2 border-outline-variant/30 bg-surface-container sticky top-0 z-20">
                <div className="w-20 flex-shrink-0 flex items-center justify-center px-2 py-3 border-r border-outline-variant/30">
                    <span className="text-[10px] font-bold text-outline uppercase tracking-widest">Hora</span>
                </div>
                {workingProfs.map(prof => (
                    <div key={prof.id} className="flex-1 min-w-0 px-3 py-3 flex flex-col items-center gap-1 border-r border-outline-variant/30 last:border-r-0">
                        <div
                            className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
                            style={{ backgroundColor: (prof.color || '#6366f1') + '33', color: prof.color || '#6366f1' }}
                        >
                            {prof.name.charAt(0)}
                        </div>
                        <span className="text-xs font-bold text-on-surface text-center truncate w-full text-center">{prof.nickname || prof.name}</span>
                        <span className="text-sm text-outline">
                            {prof.day_hours?.is_open
                                ? `${prof.day_hours.open_time.substring(0, 5)}–${prof.day_hours.close_time.substring(0, 5)}`
                                : <span className="text-xs text-red-400 font-semibold">Não atende</span>
                            }
                        </span>
                    </div>
                ))}
            </div>

            {/* Body with time rows + current-time bar */}
            <div className="relative overflow-x-auto">
                {/* Red current-time bar */}
                {timeBarTop !== null && (
                    <div
                        className="absolute left-0 right-0 z-10 flex items-center pointer-events-none"
                        style={{ top: timeBarTop }}
                    >
                        <div className="w-20 flex-shrink-0 flex items-center justify-end pr-2">
                            <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full border border-red-200">
                                {nowH.toString().padStart(2, '0')}:{nowM.toString().padStart(2, '0')}
                            </span>
                        </div>
                        <div className="h-0.5 flex-1 bg-red-500 opacity-70" />
                        <div
                            className="absolute w-2.5 h-2.5 rounded-full bg-red-500"
                            style={{ left: 'calc(80px - 5px)' }}
                        />
                    </div>
                )}

                {/* Slot rows */}
                {(() => {
                    const coveredPerProf = {};
                    return slots.map(({ hour: h, minute: m }) => {
                    const slotAbsMin = h * 60 + m;
                    // Check if all working profs have this slot covered — if so, skip row entirely
                    // We'll handle per-prof coverage inside each cell
                    return (
                    <div
                        key={`${h}-${m}`}
                        className="flex border-b border-outline-variant/20 last:border-b-0"
                        style={{ minHeight: SLOT_HEIGHT }}
                    >
                        {/* Time label */}
                        <div className="w-20 flex-shrink-0 flex flex-col items-end justify-start border-r border-outline-variant/20 bg-surface-container-low/40" style={{ paddingTop: 8, paddingRight: 6 }}>
                            <span className={`font-bold text-primary self-center ${slotInterval < 60 ? 'text-xs' : 'text-sm'}`} style={{ paddingRight: 6 }}>
                                {h.toString().padStart(2, '0')}:{m.toString().padStart(2, '0')}
                            </span>
                            {slotInterval === 60 && (
                                <div className="flex flex-col justify-around flex-1 w-full items-end" style={{ paddingTop: 4, paddingBottom: 4, paddingRight: 4 }}>
                                    {[1,2,3,4,5].map(i => (
                                        <div key={i} style={{ height: 1, background: 'rgba(114,121,115,0.5)', width: i === 3 ? 10 : 6 }} />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Professional columns */}
                        {workingProfs.map(prof => {
                            const profStartH = prof.day_hours?.is_open ? parseInt(prof.day_hours.open_time.split(':')[0]) : null;
                            const profEndH   = prof.day_hours?.is_open ? parseInt(prof.day_hours.close_time.split(':')[0]) : null;
                            const slotAbsMin = h * 60 + m;
                            const isWorking  = profStartH !== null && slotAbsMin >= profStartH * 60 && slotAbsMin < profEndH * 60;
                            const apps       = appsByProfSlot[`${prof.id}-${h}-${m}`] || [];

                            // Skip cell if covered by an ongoing appointment for this prof
                            if (coveredPerProf[prof.id] && slotAbsMin < coveredPerProf[prof.id]) {
                                return (
                                    <div
                                        key={prof.id}
                                        className="flex-1 min-w-0 p-1.5 border-r border-outline-variant/20 last:border-r-0"
                                        aria-hidden="true"
                                    />
                                );
                            }
                            // Update coverage
                            apps.forEach(app => {
                                const endMin = new Date(app.end_time).getHours() * 60 + new Date(app.end_time).getMinutes();
                                if (!coveredPerProf[prof.id] || endMin > coveredPerProf[prof.id]) {
                                    coveredPerProf[prof.id] = endMin;
                                }
                            });

                            return (
                                <div
                                    key={prof.id}
                                    className="flex-1 min-w-0 p-1.5 border-r border-outline-variant/20 last:border-r-0 flex flex-wrap gap-1 content-start"
                                    style={{ backgroundColor: !isWorking ? 'rgba(248,248,248,0.6)' : undefined }}
                                >
                                    {!isWorking ? (
                                        <div className="w-full min-h-[60px] flex items-center justify-center gap-1.5">
                                            <span className="material-symbols-outlined text-sm text-outline/30">block</span>
                                            <span className="text-xs text-outline/40 font-medium">Indisponível</span>
                                        </div>
                                    ) : apps.length === 0 ? (
                                        <div
                                            onClick={() => onSlotClick(selectedDate, `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`, prof.id)}
                                            className="w-full min-h-[60px] bg-surface-container-low/20 border border-dashed border-outline-variant/30 rounded-lg flex items-center justify-center group cursor-pointer hover:bg-surface-container-low transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-outline/20 group-hover:text-primary transition-colors text-sm">add</span>
                                        </div>
                                    ) : (
                                        apps.map(app => {
                                            const specColor = app.specialty?.color || '#6366f1';
                                            const isCanceled = app.status === 'cancelado';
                                            const durationMin = (new Date(app.end_time) - new Date(app.start_time)) / 60000;
                                            const cardHeight = Math.max(SLOT_HEIGHT - 4, (durationMin / slotInterval) * SLOT_HEIGHT - 4);
                                            const { label: stLabel, bg: stBg, text: stText } = statusStyle(app.status);
                                            return (
                                                <div
                                                    key={app.id}
                                                    className={`flex-1 min-w-[100px] border border-l-4 rounded-lg flex flex-col shadow-sm group overflow-hidden ${isCanceled ? 'opacity-50 grayscale' : ''}`}
                                                    style={{
                                                        minHeight: cardHeight,
                                                        backgroundColor: specColor + '18',
                                                        borderColor: specColor + '40',
                                                        borderLeftColor: specColor,
                                                        color: specColor,
                                                    }}
                                                >
                                                    <div className="flex-1 p-2 flex flex-col gap-0.5">
                                                        <div className="flex items-start justify-between gap-1">
                                                            <span className="text-xs font-bold text-on-surface truncate leading-tight">{app.patient.name}</span>
                                                            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                                                <button onClick={() => onEditAppointment(app)} className="p-0.5 hover:bg-black/5 rounded">
                                                                    <span className="material-symbols-outlined" style={{ fontSize: 12 }}>edit</span>
                                                                </button>
                                                                <button onClick={() => onDeleteAppointment(app)} className="p-0.5 hover:bg-black/5 rounded text-red-500">
                                                                    <span className="material-symbols-outlined" style={{ fontSize: 12 }}>delete</span>
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <span className="text-[10px] font-medium opacity-60">
                                                            {format(parseISO(app.start_time), 'HH:mm')}–{format(parseISO(app.end_time), 'HH:mm')}
                                                        </span>
                                                        {app.specialty?.name && (
                                                            <span className="text-[10px] font-bold uppercase tracking-wide opacity-70 truncate">{app.specialty.name}</span>
                                                        )}
                                                    </div>
                                                    <div className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-center ${stBg} ${stText}`}>
                                                        {stLabel}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    );});
                })()}
            </div>
        </div>
    );
}

export default function Agenda({ professionals, patients, specialties, packages, appointments, monthAppointments = [], professionalHours, allProfessionalsHours = [], filters }) {
    const [showModal, setShowModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState(filters.date);
    const [selectedProfessionalId, setSelectedProfessionalId] = useState(filters.professional_id);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [preselectedSlot, setPreselectedSlot] = useState(null);

    const openNewWithSlot = (date, hour, professionalId) => {
        setPreselectedSlot({ date, hour, professionalId });
        setSelectedAppointment(null);
        setShowModal(true);
    };
    const [dayViewActive, setDayViewActive] = useState(filters.professional_id === 'all');
    const [geralMode, setGeralMode] = useState(filters.view === 'month');
    const [slotInterval, setSlotInterval] = useState(() => {
        const saved = localStorage.getItem('agenda_slot_interval');
        return saved ? parseInt(saved) : 60;
    });
    const dateInputRef = useRef(null);

    const handleSlotInterval = (interval) => {
        setSlotInterval(interval);
        localStorage.setItem('agenda_slot_interval', interval);
    };

    const professionalConfig = useMemo(() => {
        const dayName = format(parseISO(selectedDate), 'EEEE', { locale: ptBR });
        return professionalHours.find(h => h.day_of_week.toLowerCase() === dayName.toLowerCase());
    }, [professionalHours, selectedDate]);

    const isProfessionalWorking = professionalConfig?.is_open;

    // Group appointments by slot for the grid
    const hours = useMemo(() => {
        if (!isProfessionalWorking) return [];

        const startH = parseInt(professionalConfig.open_time.split(':')[0]);
        const endH   = parseInt(professionalConfig.close_time.split(':')[0]);
        const totalMin = (endH - startH) * 60;

        const slots = [];
        for (let m = 0; m < totalMin; m += slotInterval) {
            const absMin  = startH * 60 + m;
            const slotH   = Math.floor(absMin / 60);
            const slotM   = absMin % 60;
            const label   = `${slotH.toString().padStart(2, '0')}:${slotM.toString().padStart(2, '0')}`;
            slots.push({
                label,
                absMin,
                appointments: appointments.filter(app => {
                    const dt = parseISO(app.start_time);
                    const appH = dt.getHours();
                    const appM = dt.getMinutes();
                    const slotMinFloor = Math.floor(appM / slotInterval) * slotInterval;
                    return appH === slotH && slotMinFloor === slotM;
                })
            });
        }
        return slots;
    }, [isProfessionalWorking, professionalConfig, appointments, slotInterval]);

    // Use a fixed start of week for the date selector or dynamic based on selectedDate
    const weekDays = useMemo(() => {
        const start = startOfWeek(parseISO(selectedDate), { weekStartsOn: 1 });
        return [...Array(7)].map((_, i) => addDays(start, i));
    }, [selectedDate]);

    const handleDateSelect = (date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        setSelectedDate(dateStr);
        router.get(route('agenda'), {
            date: dateStr,
            professional_id: selectedProfessionalId,
            ...(geralMode ? { view: 'month' } : {}),
        }, { preserveState: true });
    };

    const handleGeralMode = () => {
        setGeralMode(true);
        router.get(route('agenda'), {
            date: selectedDate,
            professional_id: 'all',
            view: 'month',
        }, { preserveState: true });
    };

    const handlePrevMonth = () => {
        const prev = subMonths(parseISO(selectedDate), 1);
        const dateStr = format(startOfMonth(prev), 'yyyy-MM-dd');
        setSelectedDate(dateStr);
        router.get(route('agenda'), { date: dateStr, professional_id: 'all', view: 'month' }, { preserveState: true });
    };

    const handleNextMonth = () => {
        const next = addMonths(parseISO(selectedDate), 1);
        const dateStr = format(startOfMonth(next), 'yyyy-MM-dd');
        setSelectedDate(dateStr);
        router.get(route('agenda'), { date: dateStr, professional_id: 'all', view: 'month' }, { preserveState: true });
    };

    const handlePrevWeek = () => {
        const date = subDays(parseISO(selectedDate), 7);
        handleDateSelect(date);
    };

    const handleNextWeek = () => {
        const date = addDays(parseISO(selectedDate), 7);
        handleDateSelect(date);
    };

    const handleGoToToday = () => {
        handleDateSelect(new Date());
    };

    const handleOpenPicker = () => {
        if (dateInputRef.current) {
            try {
                dateInputRef.current.showPicker();
            } catch (e) {
                dateInputRef.current.click();
            }
        }
    };

    const handleProfessionalSelect = (id) => {
        setSelectedProfessionalId(id);
        setDayViewActive(id === 'all');
        setGeralMode(false);
        router.get(route('agenda'), {
            date: selectedDate,
            professional_id: id,
        }, { preserveState: true });
    };

    const selectedProfessional = professionals.find(p => p.id == selectedProfessionalId);
    
    // Check if we are in 'all' professionals view
    const isAllMode = selectedProfessionalId === 'all';

    return (
        <AuthenticatedLayout>
            <Head title="Agenda" />

            <section className="flex items-center justify-between gap-4 mb-4">
                {/* Data + seletor */}
                <div className="flex items-center gap-3">
                    <button onClick={handleGoToToday} className="text-xs font-bold text-primary border border-primary/30 hover:bg-primary/5 px-3 py-1.5 rounded-lg transition-colors">
                        Hoje
                    </button>
                    <div className="relative">
                        <input
                            ref={dateInputRef}
                            type="date"
                            value={selectedDate}
                            onChange={(e) => handleDateSelect(parseISO(e.target.value))}
                            className="absolute inset-0 opacity-0 pointer-events-none"
                        />
                        <button onClick={handleOpenPicker} className="flex items-center gap-2 text-lg font-bold text-on-surface hover:text-primary transition-colors capitalize">
                            {format(parseISO(selectedDate), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                            <span className="material-symbols-outlined text-base text-outline">expand_more</span>
                        </button>
                    </div>
                </div>

                {/* Direita: toggle Geral/Todos/Semana + Novo Agendamento */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center border border-outline-variant/40 rounded-xl overflow-hidden bg-surface-container-lowest">
                        {[
                            { label: 'Mês',    icon: 'calendar_month', action: handleGeralMode, active: geralMode },
                            { label: 'Dia',    icon: 'group',          action: () => { setGeralMode(false); handleProfessionalSelect('all'); }, active: !geralMode && isAllMode },
                            { label: 'Semana', icon: null,             action: () => { setGeralMode(false); if (selectedProfessionalId === 'all' || !selectedProfessionalId) handleProfessionalSelect(professionals[0]?.id ?? 'all'); }, active: !geralMode && !isAllMode },
                        ].map(({ label, icon, action, active }) => (
                            <button
                                key={label}
                                onClick={action}
                                className={`px-4 py-2 text-sm font-semibold transition-colors flex items-center gap-1.5 ${active ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container'}`}
                            >
                                {icon && <span className="material-symbols-outlined text-base">{icon}</span>}
                                {label}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => setShowModal(true)}
                        disabled={geralMode}
                        className={`px-5 py-2 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md text-sm ${geralMode ? 'bg-surface-container text-on-surface-variant opacity-50 cursor-not-allowed shadow-none' : 'bg-primary text-on-primary hover:opacity-90 shadow-primary/10'}`}
                    >
                        <span className="material-symbols-outlined text-base">add</span>
                        Novo Agendamento
                    </button>
                </div>
            </section>

            {/* Horizontal Date Selector */}
            <section className={`bg-surface-container-lowest rounded-2xl p-2 border border-outline-variant/30 mt-4 relative ${geralMode ? 'hidden' : ''}`}>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handlePrevWeek}
                        className="w-10 h-10 flex items-center justify-center rounded-xl text-outline hover:bg-surface-container hover:text-primary transition-all shrink-0"
                        title="Semana Anterior"
                    >
                        <span className="material-symbols-outlined">chevron_left</span>
                    </button>

                    <div className="flex-1 flex items-center justify-between gap-1 overflow-x-auto no-scrollbar py-1">
                        {weekDays.map((day) => {
                            const active = isSameDay(day, parseISO(selectedDate));
                            return (
                                <button
                                    key={day.toString()}
                                    onClick={() => handleDateSelect(day)}
                                    className={`flex-1 min-w-[70px] flex flex-col items-center py-3 px-2 rounded-xl transition-all ${active ? 'bg-primary text-on-primary shadow-lg shadow-primary/20 scale-105 z-10' : 'text-on-surface-variant hover:bg-surface-container'}`}
                                >
                                    <span className="text-[10px] font-bold uppercase tracking-wider mb-1">
                                        {format(day, 'EEE', { locale: ptBR })}
                                    </span>
                                    <span className="text-lg font-extrabold">{format(day, 'dd')}</span>
                                </button>
                            );
                        })}
                    </div>

                    <button
                        onClick={handleNextWeek}
                        className="w-10 h-10 flex items-center justify-center rounded-xl text-outline hover:bg-surface-container hover:text-primary transition-all shrink-0"
                        title="Próxima Semana"
                    >
                        <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                </div>
            </section>

            {/* Professional Filters */}
            <section className="bg-surface-container-lowest p-5 rounded-2xl flex flex-col gap-4 border border-outline-variant/30 mt-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <label className="text-xs font-bold text-primary tracking-widest uppercase">Selecionar Profissional</label>
                    <div className="flex items-center gap-3"></div>
                </div>
                <div className="flex flex-wrap gap-4">
                    {professionals.map(p => (
                        <label 
                            key={p.id}
                            onClick={() => handleProfessionalSelect(p.id)}
                            className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${selectedProfessionalId == p.id ? 'bg-primary text-on-primary border-primary shadow-md' : 'bg-surface-container-low hover:bg-surface-container border-transparent'}`}
                        >
                            <div className="w-8 h-8 rounded-full bg-primary-container text-primary flex items-center justify-center font-bold text-xs" style={{ backgroundColor: p.color + '33', color: p.color }}>
                                {p.name.charAt(0)}
                            </div>
                            <span className={`text-sm font-bold ${selectedProfessionalId == p.id ? 'text-on-primary' : 'text-on-surface'}`}>
                                {p.nickname || p.name}
                            </span>
                            {selectedProfessionalId == p.id && (
                                <span className="ml-1 material-symbols-outlined text-lg">check_circle</span>
                            )}
                        </label>
                    ))}
                </div>
            </section>

            {/* Geral — Monthly Calendar */}
            {geralMode && (
                <MonthCalendar
                    selectedDate={parseISO(selectedDate)}
                    monthAppointments={monthAppointments}
                    onDayClick={(day) => {
                        setGeralMode(false);
                        handleProfessionalSelect('all');
                        const dateStr = format(day, 'yyyy-MM-dd');
                        setSelectedDate(dateStr);
                        router.get(route('agenda'), { date: dateStr, professional_id: 'all' }, { preserveState: true });
                    }}
                    onPrevMonth={handlePrevMonth}
                    onNextMonth={handleNextMonth}
                    onNewAppointment={() => setShowModal(true)}
                />
            )}

            {/* All-professionals multi-column grid */}
            {isAllMode && !geralMode && (
                <AllProfessionalsGrid
                    allProfessionalsHours={allProfessionalsHours}
                    appointments={appointments}
                    selectedDate={selectedDate}
                    slotInterval={slotInterval}
                    onNewAppointment={() => setShowModal(true)}
                    onSlotClick={openNewWithSlot}
                    onEditAppointment={(app) => { setSelectedAppointment(app); setShowModal(true); }}
                    onDeleteAppointment={(app) => {
                        if (confirm('Tem certeza que deseja excluir este agendamento?')) {
                            router.delete(route('appointments.destroy', app.id));
                        }
                    }}
                />
            )}

            {/* Single-professional grid — hidden in all mode or geral mode */}
            <section className={`space-y-1 mt-4 ${isAllMode || geralMode ? 'hidden' : ''}`}>
                {!isProfessionalWorking ? (
                    <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-12 flex flex-col items-center text-center gap-4">
                        <div className="w-20 h-20 bg-stone-100 dark:bg-stone-800 rounded-full flex items-center justify-center text-stone-400">
                            <span className="material-symbols-outlined text-4xl">event_busy</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-stone-900">Profissional Indisponível</h2>
                            <p className="text-stone-500">Este profissional não realiza atendimentos neste dia da semana.</p>
                        </div>
                        <Link
                            href={route('professionals.edit', selectedProfessionalId)}
                            className="text-primary font-bold text-sm hover:underline"
                        >
                            Editar horários de {selectedProfessional?.name}
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-[80px_1fr] md:grid-cols-[100px_1fr_1fr_1fr] gap-x-px bg-outline-variant/30 border border-outline-variant/30 rounded-t-2xl overflow-hidden">
                            <div className="bg-surface-container px-4 py-3 flex items-center justify-center">
                                <span className="text-xs font-bold text-outline uppercase tracking-widest">Hora</span>
                            </div>
                            <div className="flex bg-surface-container px-4 py-3 items-center justify-center border-l border-outline-variant/30 col-span-1 md:col-span-3">
                                <span className="text-xs font-bold text-outline uppercase tracking-widest">
                                    {`Atendimentos de ${selectedProfessional?.name}`}
                                </span>
                            </div>
                        </div>

                        {(() => {
                            let coveredUntilMin = 0;
                            return hours.map((hourObj) => {
                            const slotMinHeight = slotInterval === 60 ? 90 : slotInterval === 30 ? 52 : 32;

                            // Skip this slot if it's covered by an ongoing appointment
                            if (hourObj.absMin < coveredUntilMin) return null;

                            // Update coveredUntilMin for appointments starting in this slot
                            hourObj.appointments.forEach(app => {
                                const endMin = new Date(app.end_time).getHours() * 60 + new Date(app.end_time).getMinutes();
                                if (endMin > coveredUntilMin) coveredUntilMin = endMin;
                            });

                            return (
                            <div key={hourObj.label} className="grid grid-cols-[80px_1fr] md:grid-cols-[100px_1fr] gap-x-px bg-outline-variant/30 border-x border-b border-outline-variant/30 last:rounded-b-2xl overflow-hidden">
                                <div className="bg-surface-container-low flex flex-col" style={{ minHeight: slotMinHeight }}>
                                    {Array.from({ length: slotInterval / 10 }).map((_, i) => (
                                        <div key={i} className="flex-1 flex items-start justify-end pr-2 pt-1 relative">
                                            {i === 0 ? (
                                                <span className={`font-bold text-primary ${slotInterval < 60 ? 'text-xs' : 'text-lg'}`}>{hourObj.label}</span>
                                            ) : (
                                                <div style={{
                                                    width: i === 3 ? 10 : 6,
                                                    height: 1,
                                                    background: 'rgba(114,121,115,0.45)',
                                                    marginTop: 4,
                                                }} />
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <div className="bg-white p-2 flex flex-wrap gap-2">
                                    {hourObj.appointments.length === 0 ? (
                                        <div
                                            onClick={() => openNewWithSlot(selectedDate, hourObj.label, selectedProfessionalId)}
                                            className="flex-1 bg-surface-container-low/30 border border-dashed border-outline-variant/50 rounded-xl flex items-center justify-center group cursor-pointer hover:bg-surface-container-low transition-colors"
                                            style={{ minHeight: slotMinHeight - 8 }}
                                        >
                                            <span className="material-symbols-outlined text-outline/30 group-hover:text-primary transition-colors">add</span>
                                        </div>
                                    ) : (
                                        hourObj.appointments.map(app => {
                                            const specColor = app.specialty?.color || '#6366f1';
                                            const isCanceled = app.status === 'cancelado';
                                            const durationMin = (new Date(app.end_time) - new Date(app.start_time)) / 60000;
                                            const cardHeight = Math.max(slotMinHeight - 8, (durationMin / slotInterval) * slotMinHeight - 8);

                                            return (
                                                <div
                                                    key={app.id}
                                                    className={`min-w-[250px] flex-1 border border-l-4 rounded-xl p-3 flex flex-col justify-between shadow-sm relative group ${isCanceled ? 'opacity-50 grayscale' : ''}`}
                                                    style={{
                                                        minHeight: cardHeight,
                                                        backgroundColor: specColor + '18',
                                                        borderColor: specColor + '40',
                                                        borderLeftColor: specColor,
                                                        color: specColor,
                                                    }}
                                                >
                                                    <div>
                                                        <div className="flex items-start justify-between mb-1">
                                                            <h3 className="font-bold text-sm" style={{ color: specColor }}>{app.patient.name}</h3>
                                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedAppointment(app);
                                                                        setShowModal(true);
                                                                    }}
                                                                    className="p-1 hover:bg-black/5 rounded text-inherit"
                                                                    title="Editar Agendamento"
                                                                >
                                                                    <span className="material-symbols-outlined text-xs">edit</span>
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        if (confirm('Tem certeza que deseja excluir este agendamento?')) {
                                                                            router.delete(route('appointments.destroy', app.id));
                                                                        }
                                                                    }}
                                                                    className="p-1 hover:bg-black/5 rounded text-red-500"
                                                                    title="Excluir Agendamento"
                                                                >
                                                                    <span className="material-symbols-outlined text-xs">delete</span>
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: specColor + '30', color: specColor }}>
                                                            {format(parseISO(app.start_time), 'HH:mm')} - {format(parseISO(app.end_time), 'HH:mm')}
                                                        </span>
                                                    </div>
                                                    {app.specialty?.name && (
                                                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-70 mt-1 block">{app.specialty.name}</span>
                                                    )}
                                                    <div className={`absolute bottom-0 left-0 right-0 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-center rounded-b-xl ${statusStyle(app.status).bg} ${statusStyle(app.status).text}`}>
                                                        {statusStyle(app.status).label}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        ); });
                        })()}
                    </>
                )}
            </section>

            <AppointmentModal
                show={showModal}
                onClose={() => {
                    setShowModal(false);
                    setSelectedAppointment(null);
                    setPreselectedSlot(null);
                }}
                appointment={selectedAppointment}
                professionals={professionals}
                patients={patients}
                specialties={specialties}
                packages={packages}
                appointments={appointments}
                professionalHours={professionalHours}
                selectedDate={preselectedSlot?.date ?? selectedDate}
                selectedProfessionalId={preselectedSlot?.professionalId ?? selectedProfessionalId}
                preselectedHour={preselectedSlot?.hour ?? null}
            />
        </AuthenticatedLayout>
    );
}
