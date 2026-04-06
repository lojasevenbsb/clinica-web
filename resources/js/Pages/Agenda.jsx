import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState, useMemo, useRef, useEffect } from 'react';
import AppointmentModal from '@/Components/AppointmentModal';
import { format, addDays, subDays, startOfWeek, isSameDay, parseISO, startOfMonth, endOfMonth, addMonths, subMonths, getDaysInMonth, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';

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

    const statusColor = (status) => ({
        confirmado: 'bg-emerald-500',
        pendente:   'bg-amber-400',
        cancelado:  'bg-red-400',
        atendido:   'bg-stone-400',
    }[status] ?? 'bg-amber-400');

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
                                    className="flex items-center gap-1 text-[10px] font-medium text-stone-700 bg-stone-100 rounded-md px-1.5 py-0.5 truncate"
                                    title={`${app.patient?.name} — ${app.start_time.substring(11, 16)}`}
                                >
                                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusColor(app.status)}`} />
                                    <span className="truncate">{app.patient?.name}</span>
                                    <span className="flex-shrink-0 text-stone-400">{app.start_time.substring(11, 16)}</span>
                                </div>
                            ))}
                            {extra > 0 && <span className="text-[10px] text-primary font-bold pl-1">+{extra} mais</span>}
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 px-6 py-3 border-t border-outline-variant/20 bg-stone-50/50">
                {[['confirmado','bg-emerald-500'],['pendente','bg-amber-400'],['cancelado','bg-red-400'],['atendido','bg-stone-400']].map(([label, cls]) => (
                    <span key={label} className="flex items-center gap-1.5 text-[11px] text-stone-500 font-medium capitalize">
                        <span className={`w-2 h-2 rounded-full ${cls}`} /> {label}
                    </span>
                ))}
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
function AllProfessionalsGrid({ allProfessionalsHours, appointments, selectedDate, onNewAppointment, onEditAppointment, onDeleteAppointment }) {
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 30000);
        return () => clearInterval(id);
    }, []);

    const workingProfs = allProfessionalsHours.filter(p => p.day_hours?.is_open);

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

    const startHour = Math.min(...workingProfs.map(p => parseInt(p.day_hours.open_time.split(':')[0])));
    const endHour   = Math.max(...workingProfs.map(p => parseInt(p.day_hours.close_time.split(':')[0])));

    const hours = [];
    for (let h = startHour; h < endHour; h++) hours.push(h);

    const SLOT_HEIGHT = 90; // px per hour slot

    const appsByProfHour = {};
    appointments.forEach(app => {
        const h   = parseISO(app.start_time).getHours();
        const key = `${app.professional_id}-${h}`;
        if (!appsByProfHour[key]) appsByProfHour[key] = [];
        appsByProfHour[key].push(app);
    });

    const isToday   = isSameDay(parseISO(selectedDate), new Date());
    const nowH      = now.getHours();
    const nowM      = now.getMinutes();
    const timeBarTop = (isToday && nowH >= startHour && nowH < endHour)
        ? ((nowH - startHour) + nowM / 60) * SLOT_HEIGHT
        : null;

    const statusStyles = {
        cancelado:  'bg-red-50 border-l-red-500 text-red-700',
        confirmado: 'bg-emerald-50 border-l-emerald-500 text-emerald-700',
        atendido:   'bg-stone-50 border-l-stone-400 text-stone-600',
        pendente:   'bg-amber-50 border-l-amber-500 text-amber-700',
    };

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
                        <span className="text-xs font-bold text-on-surface text-center truncate w-full text-center">{prof.name}</span>
                        <span className="text-[10px] text-outline">
                            {prof.day_hours.open_time.substring(0, 5)}–{prof.day_hours.close_time.substring(0, 5)}
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

                {/* Hour rows */}
                {hours.map(h => (
                    <div
                        key={h}
                        className="flex border-b border-outline-variant/20 last:border-b-0"
                        style={{ minHeight: SLOT_HEIGHT }}
                    >
                        {/* Time label */}
                        <div className="w-20 flex-shrink-0 flex flex-col items-center justify-start pt-3 border-r border-outline-variant/20 bg-surface-container-low/40">
                            <span className="text-sm font-bold text-primary">{h.toString().padStart(2, '0')}:00</span>
                        </div>

                        {/* Professional columns */}
                        {workingProfs.map(prof => {
                            const profStart = parseInt(prof.day_hours.open_time.split(':')[0]);
                            const profEnd   = parseInt(prof.day_hours.close_time.split(':')[0]);
                            const isWorking = h >= profStart && h < profEnd;
                            const apps      = appsByProfHour[`${prof.id}-${h}`] || [];

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
                                            onClick={onNewAppointment}
                                            className="w-full min-h-[60px] bg-surface-container-low/20 border border-dashed border-outline-variant/30 rounded-lg flex items-center justify-center group cursor-pointer hover:bg-surface-container-low transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-outline/20 group-hover:text-primary transition-colors text-sm">add</span>
                                        </div>
                                    ) : (
                                        apps.map(app => {
                                            const style = statusStyles[app.status] || statusStyles.pendente;
                                            return (
                                                <div
                                                    key={app.id}
                                                    className={`flex-1 min-w-[100px] border border-l-4 rounded-lg p-2 flex flex-col gap-0.5 shadow-sm group ${style}`}
                                                >
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
                                                        <span className="text-[10px] font-bold uppercase tracking-wide opacity-60 truncate">{app.specialty.name}</span>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function Agenda({ professionals, patients, specialties, packages, appointments, monthAppointments = [], professionalHours, allProfessionalsHours = [], filters }) {
    const [showModal, setShowModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState(filters.date);
    const [selectedProfessionalId, setSelectedProfessionalId] = useState(filters.professional_id);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [dayViewActive, setDayViewActive] = useState(filters.professional_id === 'all');
    const dateInputRef = useRef(null);

    const professionalConfig = useMemo(() => {
        const dayName = format(parseISO(selectedDate), 'EEEE', { locale: ptBR });
        return professionalHours.find(h => h.day_of_week.toLowerCase() === dayName.toLowerCase());
    }, [professionalHours, selectedDate]);

    const isProfessionalWorking = professionalConfig?.is_open;

    // Group appointments by hour for the grid
    const hours = useMemo(() => {
        if (!isProfessionalWorking) return [];
        
        const start = parseInt(professionalConfig.open_time.split(':')[0]);
        const end = parseInt(professionalConfig.close_time.split(':')[0]);
        
        const slots = [];
        for (let h = start; h < end; h++) {
            slots.push({
                label: `${h.toString().padStart(2, '0')}:00`,
                appointments: appointments.filter(app => {
                    const appDate = parseISO(app.start_time);
                    return appDate.getHours() === h;
                })
            });
        }
        return slots;
    }, [isProfessionalWorking, professionalConfig, appointments]);

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
            professional_id: selectedProfessionalId 
        }, { preserveState: true });
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
        router.get(route('agenda'), {
            date: selectedDate,
            professional_id: id
        }, { preserveState: true });
    };

    const selectedProfessional = professionals.find(p => p.id == selectedProfessionalId);
    
    // Check if we are in 'all' professionals view
    const isAllMode = selectedProfessionalId === 'all';

    return (
        <AuthenticatedLayout>
            <Head title="Agenda" />

            <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-primary mb-2">Agenda de Atendimentos</h1>
                    <p className="text-on-surface-variant capitalize">
                        {format(parseISO(selectedDate), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-xl border border-outline-variant/30">
                        <button 
                            onClick={handleGoToToday}
                            className="px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-primary hover:bg-primary/5 rounded-lg transition-colors"
                        >
                            Hoje
                        </button>
                        <div className="w-px h-4 bg-outline-variant/30 mx-1"></div>
                        <div className="relative">
                            <input 
                                ref={dateInputRef}
                                type="date"
                                value={selectedDate}
                                onChange={(e) => handleDateSelect(parseISO(e.target.value))}
                                className="absolute inset-0 opacity-0 pointer-events-none"
                                id="date-picker-input"
                            />
                            <button 
                                onClick={handleOpenPicker}
                                className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-on-surface-variant hover:bg-surface-container transition-colors rounded-lg cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-lg">calendar_month</span>
                                Selecionar Data
                            </button>
                        </div>
                    </div>

                    <button 
                        onClick={() => setShowModal(true)}
                        className="bg-primary text-on-primary px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-primary/10"
                    >
                        <span className="material-symbols-outlined text-xl">add</span>
                        Novo Agendamento
                    </button>
                </div>
            </section>

            {/* Professional Filters */}
            <section className="bg-surface-container-lowest p-5 rounded-2xl flex flex-col gap-4 border border-outline-variant/30">
                <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-primary tracking-widest uppercase">Selecionar Profissional</label>
                    <button
                        onClick={() => handleDateSelect(new Date())}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-sm font-bold bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                    >
                        <span className="material-symbols-outlined text-base">today</span>
                        Hoje
                    </button>
                </div>
                <div className="flex flex-wrap gap-4">
                    <button
                        onClick={() => handleProfessionalSelect('all')}
                        className={`flex items-center gap-3 p-3 px-5 rounded-xl cursor-pointer transition-all border ${selectedProfessionalId === 'all' ? 'bg-primary text-on-primary border-primary shadow-md' : 'bg-surface-container-low hover:bg-surface-container border-transparent'}`}
                    >
                        <span className="material-symbols-outlined">group</span>
                        <span className={`text-sm font-bold ${selectedProfessionalId === 'all' ? 'text-on-primary' : 'text-on-surface'}`}>
                            Todos
                        </span>
                        {selectedProfessionalId === 'all' && (
                            <span className="ml-1 material-symbols-outlined text-lg">check_circle</span>
                        )}
                    </button>

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
                                {p.name}
                            </span>
                            {selectedProfessionalId == p.id && (
                                <span className="ml-1 material-symbols-outlined text-lg">check_circle</span>
                            )}
                        </label>
                    ))}
                </div>
            </section>

            {/* Horizontal Date Selector */}
            <section className="bg-surface-container-lowest rounded-2xl p-2 border border-outline-variant/30 mt-4 relative">
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

            {/* All-professionals multi-column grid */}
            {isAllMode && (
                <AllProfessionalsGrid
                    allProfessionalsHours={allProfessionalsHours}
                    appointments={appointments}
                    selectedDate={selectedDate}
                    onNewAppointment={() => setShowModal(true)}
                    onEditAppointment={(app) => { setSelectedAppointment(app); setShowModal(true); }}
                    onDeleteAppointment={(app) => {
                        if (confirm('Tem certeza que deseja excluir este agendamento?')) {
                            router.delete(route('appointments.destroy', app.id));
                        }
                    }}
                />
            )}

            {/* Single-professional grid — hidden in all mode */}
            <section className={`space-y-1 mt-4 ${isAllMode ? 'hidden' : ''}`}>
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

                        {hours.map((hourObj) => (
                            <div key={hourObj.label} className="grid grid-cols-[80px_1fr] md:grid-cols-[100px_1fr] gap-x-px bg-outline-variant/30 border-x border-b border-outline-variant/30 last:rounded-b-2xl overflow-hidden">
                                <div className="bg-surface-container-low px-4 py-8 flex flex-col items-center justify-center">
                                    <span className="text-lg font-bold text-primary">{hourObj.label}</span>
                                </div>
                                <div className="bg-white p-2 flex flex-wrap gap-2">
                                    {hourObj.appointments.length === 0 ? (
                                        <div
                                            onClick={() => setShowModal(true)}
                                            className="flex-1 min-h-[90px] bg-surface-container-low/30 border border-dashed border-outline-variant/50 rounded-xl flex items-center justify-center group cursor-pointer hover:bg-surface-container-low transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-outline/30 group-hover:text-primary transition-colors">add</span>
                                        </div>
                                    ) : (
                                        hourObj.appointments.map(app => {
                                            const statusStyles = {
                                                cancelado: 'bg-red-50 border-red-100 border-l-red-500 text-red-700',
                                                confirmado: 'bg-emerald-50 border-emerald-100 border-l-emerald-500 text-emerald-700',
                                                atendido: 'bg-stone-50 border-stone-200 border-l-stone-500 text-stone-600 grayscale',
                                                pendente: 'bg-amber-50 border-amber-100 border-l-amber-500 text-amber-700',
                                            }[app.status] || 'bg-amber-50 border-amber-100 border-l-amber-500 text-amber-700';

                                            return (
                                                <div
                                                    key={app.id}
                                                    className={`min-w-[250px] flex-1 border border-l-4 rounded-xl p-3 flex flex-col justify-between min-h-[90px] shadow-sm relative group ${statusStyles}`}
                                                >
                                                    <div>
                                                        <div className="flex items-start justify-between mb-1">
                                                            <h3 className="font-bold text-sm text-on-surface">{app.patient.name}</h3>
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
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${app.status === 'cancelado' ? 'bg-red-200' : 'bg-primary-fixed text-on-primary-fixed-variant'}`}>
                                                            {format(parseISO(app.start_time), 'HH:mm')} - {format(parseISO(app.end_time), 'HH:mm')}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between mt-2">
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] text-outline font-bold uppercase tracking-wider">{app.specialty?.name}</span>
                                                        </div>
                                                        <span className="text-[10px] font-extrabold uppercase">{app.status}</span>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        ))}
                    </>
                )}
            </section>

            <AppointmentModal 
                show={showModal} 
                onClose={() => {
                    setShowModal(false);
                    setSelectedAppointment(null);
                }}
                appointment={selectedAppointment}
                professionals={professionals}
                patients={patients}
                specialties={specialties}
                packages={packages}
                appointments={appointments}
                professionalHours={professionalHours}
                selectedDate={selectedDate}
                selectedProfessionalId={selectedProfessionalId}
            />
        </AuthenticatedLayout>
    );
}
