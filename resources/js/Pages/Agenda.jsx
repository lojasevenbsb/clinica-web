import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import AppointmentModal from '@/Components/AppointmentModal';
import { format, addDays, subDays, startOfWeek, isSameDay, parseISO, startOfMonth, endOfMonth, addMonths, subMonths, getDaysInMonth, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';

/* ─────────────────────────────────────────
   Status helper
───────────────────────────────────────── */
function statusStyle(status) {
    switch (status) {
        case 'confirmado': return { label: 'Confirmado', bg: 'bg-emerald-500', text: 'text-white', color: '#10b981' };
        case 'cancelado':  return { label: 'Cancelado',  bg: 'bg-red-400',     text: 'text-white', color: '#f87171' };
        case 'atendido':   return { label: 'Atendido',   bg: 'bg-sky-500',     text: 'text-white', color: '#0ea5e9' };
        default:           return { label: 'Pendente',   bg: 'bg-amber-400',   text: 'text-white', color: '#fbbf24' };
    }
}

/* ─────────────────────────────────────────
   Status options
───────────────────────────────────────── */
const STATUS_OPTIONS = [
    { value: 'pendente',   label: 'Pendente',   bg: '#fbbf24', text: '#fff' },
    { value: 'confirmado', label: 'Confirmado', bg: '#10b981', text: '#fff' },
    { value: 'atendido',   label: 'Atendido',   bg: '#0ea5e9', text: '#fff' },
    { value: 'cancelado',  label: 'Cancelado',  bg: '#f87171', text: '#fff' },
];

/* ─────────────────────────────────────────
   Appointment Card (with inline status change)
───────────────────────────────────────── */
function AppointmentCard({ app, specColor, isCanceled, cardHeight, onEdit, onDelete }) {
    const [statusOpen, setStatusOpen] = useState(false);
    const [currentStatus, setCurrentStatus] = useState(app.status || 'pendente');
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
    const footerRef = useRef(null);

    const { label, color: sColor } = statusStyle(currentStatus);

    // Sync when server re-renders with updated app.status
    useEffect(() => {
        setCurrentStatus(app.status || 'pendente');
    }, [app.status]);

    const handleStatusChange = (newStatus) => {
        setCurrentStatus(newStatus);
        setStatusOpen(false);
        router.patch(route('appointments.updateStatus', app.id), { status: newStatus }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const openDropdown = useCallback(() => {
        if (footerRef.current) {
            const rect = footerRef.current.getBoundingClientRect();
            setDropdownPos({
                top: rect.top,        // dropdown abre acima do botão
                left: rect.left,
                width: rect.width,
            });
        }
        setStatusOpen(o => !o);
    }, []);

    // Fecha ao clicar fora
    useEffect(() => {
        if (!statusOpen) return;
        const close = (e) => {
            if (footerRef.current && !footerRef.current.contains(e.target)) {
                setStatusOpen(false);
            }
        };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, [statusOpen]);

    const DROPDOWN_HEIGHT = STATUS_OPTIONS.length * 36; // aprox px por opção

    return (
        <div
            className={`flex-1 rounded-xl flex flex-col overflow-hidden shadow-sm group transition-shadow hover:shadow-md relative ${isCanceled ? 'opacity-50' : ''}`}
            style={{
                height: cardHeight,
                background: '#ffffff',
                border: `1px solid ${specColor}30`,
                borderLeft: `4px solid ${specColor}`,
            }}
        >
            {/* Card body */}
            <div className="flex-1 px-2.5 pt-2 pb-1 flex flex-col gap-0.5 min-h-0 overflow-hidden" style={{ background: specColor + '09' }}>
                {/* Name + actions */}
                <div className="flex items-start justify-between gap-1">
                    <span className="text-[12px] font-black text-gray-800 leading-tight truncate">{app.patient.name}</span>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button
                            onClick={onEdit}
                            className="p-0.5 rounded hover:bg-black/5 text-gray-400 hover:text-gray-700 transition-colors"
                            title="Editar"
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: 12 }}>edit</span>
                        </button>
                        <button
                            onClick={onDelete}
                            className="p-0.5 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"
                            title="Excluir"
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: 12 }}>delete</span>
                        </button>
                    </div>
                </div>

                {/* Time */}
                <span className="text-[10px] font-semibold text-gray-400 tabular-nums leading-none">
                    {format(parseISO(app.start_time), 'HH:mm')} – {format(parseISO(app.end_time), 'HH:mm')}
                </span>
            </div>

            {/* Status footer — clicável para trocar */}
            <div ref={footerRef} className="flex-shrink-0">
                <button
                    onClick={openDropdown}
                    className="w-full flex items-center justify-between gap-1 px-2 py-1 hover:opacity-90 transition-opacity"
                    style={{ background: sColor, color: '#fff' }}
                    title="Alterar status"
                >
                    <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/50 flex-shrink-0" />
                        <span className="text-[10px] font-black uppercase tracking-widest truncate">{label}</span>
                    </div>
                    <span className="material-symbols-outlined text-white/70 flex-shrink-0" style={{ fontSize: 12 }}>
                        {statusOpen ? 'expand_less' : 'expand_more'}
                    </span>
                </button>

                {/* Dropdown via portal — escapa de qualquer overflow:hidden */}
                {statusOpen && createPortal(
                    <div
                        className="fixed z-[9999] rounded-xl overflow-hidden shadow-xl border border-gray-100"
                        style={{
                            top: dropdownPos.top - DROPDOWN_HEIGHT - 4,
                            left: dropdownPos.left,
                            width: dropdownPos.width,
                            background: '#fff',
                        }}
                    >
                        {STATUS_OPTIONS.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => handleStatusChange(opt.value)}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-gray-50 transition-colors"
                                style={{ color: '#374151' }}
                            >
                                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: opt.bg }} />
                                <span className="text-[12px] font-bold flex-1">{opt.label}</span>
                                {currentStatus === opt.value && (
                                    <span className="material-symbols-outlined" style={{ fontSize: 14, color: opt.bg }}>check</span>
                                )}
                            </button>
                        ))}
                    </div>,
                    document.body
                )}
            </div>
        </div>
    );
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
        <div className="mt-4 rounded-2xl overflow-hidden shadow-sm border border-outline-variant/20" style={{ background: '#f8f9fb' }}>
            {/* Header row — professional names */}
            <div className="flex border-b border-outline-variant/20 sticky top-0 z-20" style={{ background: '#ffffff' }}>
                {/* Hour column header */}
                <div className="w-[72px] flex-shrink-0 flex items-center justify-center border-r border-outline-variant/15" style={{ background: '#f3f4f6', minHeight: 72 }}>
                    <span className="material-symbols-outlined text-outline/40" style={{ fontSize: 18 }}>schedule</span>
                </div>

                {workingProfs.map((prof, idx) => {
                    const color = prof.color || '#6366f1';
                    const isOpen = prof.day_hours?.is_open;
                    return (
                        <div
                            key={prof.id}
                            className="flex-1 min-w-0 flex flex-col items-center justify-center gap-1.5 py-4 px-2 border-r border-outline-variant/15 last:border-r-0 relative"
                            style={{ borderTop: `3px solid ${isOpen ? color : '#d1d5db'}` }}
                        >
                            {/* Avatar */}
                            <div
                                className="w-10 h-10 rounded-full flex items-center justify-center font-black text-base flex-shrink-0 shadow-sm"
                                style={{ background: color + '22', color }}
                            >
                                {prof.name.charAt(0).toUpperCase()}
                            </div>

                            {/* Name */}
                            <span className="text-[13px] font-bold text-gray-800 text-center leading-tight truncate w-full text-center px-1">
                                {prof.nickname || prof.name}
                            </span>

                            {/* Hours or badge */}
                            {isOpen ? (
                                <span className="text-[11px] font-semibold text-gray-400">
                                    {prof.day_hours.open_time.substring(0, 5)} – {prof.day_hours.close_time.substring(0, 5)}
                                </span>
                            ) : (
                                <span className="text-[10px] font-bold text-red-400 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                                    Não atende hoje
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Body */}
            <div className="relative overflow-x-auto">
                {/* Current time bar */}
                {timeBarTop !== null && (
                    <div
                        className="absolute left-0 right-0 z-10 flex items-center pointer-events-none"
                        style={{ top: timeBarTop }}
                    >
                        <div className="w-[72px] flex-shrink-0 flex items-center justify-center">
                            <span className="text-[11px] font-black text-white bg-red-500 px-2 py-0.5 rounded-full shadow-sm shadow-red-200">
                                {nowH.toString().padStart(2, '0')}:{nowM.toString().padStart(2, '0')}
                            </span>
                        </div>
                        <div className="h-[2px] flex-1 bg-red-500 opacity-80" />
                    </div>
                )}

                {/* Slot rows */}
                {(() => {
                    const coveredPerProf = {};
                    return slots.map(({ hour: h, minute: m }) => {
                    const slotAbsMin = h * 60 + m;
                    const isHourMark = m === 0;
                    return (
                    <div
                        key={`${h}-${m}`}
                        className="flex last:border-b-0"
                        style={{
                            height: SLOT_HEIGHT,
                            borderBottom: isHourMark ? '1px solid rgba(0,0,0,0.07)' : '1px solid rgba(0,0,0,0.03)',
                        }}
                    >
                        {/* Time label */}
                        <div
                            className="w-[72px] flex-shrink-0 flex items-start justify-end border-r border-outline-variant/15 select-none"
                            style={{ background: '#f3f4f6', paddingTop: 8, paddingRight: 10 }}
                        >
                            {isHourMark ? (
                                <span className="text-[12px] font-black text-indigo-500 tabular-nums">
                                    {h.toString().padStart(2, '0')}:{m.toString().padStart(2, '0')}
                                </span>
                            ) : (
                                <span className="text-[10px] font-medium text-gray-300 tabular-nums">
                                    {h.toString().padStart(2, '0')}:{m.toString().padStart(2, '0')}
                                </span>
                            )}
                        </div>

                        {/* Professional columns */}
                        {workingProfs.map(prof => {
                            const profStartH = prof.day_hours?.is_open ? parseInt(prof.day_hours.open_time.split(':')[0]) : null;
                            const profEndH   = prof.day_hours?.is_open ? parseInt(prof.day_hours.close_time.split(':')[0]) : null;
                            const slotAbsMin = h * 60 + m;
                            const isWorking  = profStartH !== null && slotAbsMin >= profStartH * 60 && slotAbsMin < profEndH * 60;
                            const apps       = appsByProfSlot[`${prof.id}-${h}-${m}`] || [];
                            const profColor  = prof.color || '#6366f1';

                            if (coveredPerProf[prof.id] && slotAbsMin < coveredPerProf[prof.id]) {
                                return (
                                    <div
                                        key={prof.id}
                                        className="flex-1 min-w-0 border-r border-outline-variant/10 last:border-r-0"
                                        aria-hidden="true"
                                        style={{ background: '#ffffff' }}
                                    />
                                );
                            }

                            apps.forEach(app => {
                                const endMin = new Date(app.end_time).getHours() * 60 + new Date(app.end_time).getMinutes();
                                if (!coveredPerProf[prof.id] || endMin > coveredPerProf[prof.id]) {
                                    coveredPerProf[prof.id] = endMin;
                                }
                            });

                            if (!isWorking) {
                                return (
                                    <div
                                        key={prof.id}
                                        className="flex-1 min-w-0 border-r border-outline-variant/10 last:border-r-0"
                                        style={{
                                            background: 'repeating-linear-gradient(135deg, #f9fafb 0px, #f9fafb 6px, #f3f4f6 6px, #f3f4f6 12px)',
                                        }}
                                    />
                                );
                            }

                            if (apps.length === 0) {
                                return (
                                    <div
                                        key={prof.id}
                                        className="flex-1 min-w-0 border-r border-outline-variant/10 last:border-r-0 p-1.5 group cursor-pointer transition-colors"
                                        style={{ background: '#ffffff' }}
                                        onClick={() => onSlotClick(selectedDate, `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`, prof.id)}
                                    >
                                        <div
                                            className="w-full h-full rounded-lg flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all"
                                            style={{ background: profColor + '10', border: `1px dashed ${profColor}50` }}
                                        >
                                            <span className="material-symbols-outlined text-sm" style={{ color: profColor }}>add</span>
                                            <span className="text-[11px] font-semibold" style={{ color: profColor }}>Agendar</span>
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <div
                                    key={prof.id}
                                    className="flex-1 min-w-0 border-r border-outline-variant/10 last:border-r-0 p-1.5 flex flex-col gap-1 content-start"
                                    style={{ background: '#ffffff' }}
                                >
                                    {apps.map(app => {
                                        const specColor = app.specialty?.color || '#6366f1';
                                        const isCanceled = app.status === 'cancelado';

                                        return (
                                            <AppointmentCard
                                                key={app.id}
                                                app={app}
                                                specColor={specColor}
                                                isCanceled={isCanceled}
                                                cardHeight={SLOT_HEIGHT - 6}
                                                onEdit={() => onEditAppointment(app)}
                                                onDelete={() => onDeleteAppointment(app)}
                                            />
                                        );
                                    })}
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
                <div className="flex items-center gap-2.5">
                    <button
                        onClick={handleGoToToday}
                        className="text-[12px] font-black text-indigo-600 border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                    >
                        Hoje
                    </button>
                    <div className="w-px h-5 bg-gray-200" />
                    <div className="relative">
                        <input
                            ref={dateInputRef}
                            type="date"
                            value={selectedDate}
                            onChange={(e) => handleDateSelect(parseISO(e.target.value))}
                            className="absolute inset-0 opacity-0 pointer-events-none"
                        />
                        <button onClick={handleOpenPicker} className="flex items-center gap-1.5 text-base font-black text-gray-800 hover:text-indigo-600 transition-colors capitalize">
                            {format(parseISO(selectedDate), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                            <span className="material-symbols-outlined text-sm text-gray-400">expand_more</span>
                        </button>
                    </div>
                </div>

                {/* Direita: toggle views + Novo Agendamento */}
                <div className="flex items-center gap-2.5">
                    {/* View toggle */}
                    <div className="flex items-center rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm">
                        {[
                            { label: 'Mês',    icon: 'calendar_month', action: handleGeralMode, active: geralMode },
                            { label: 'Dia',    icon: 'group',          action: () => { setGeralMode(false); handleProfessionalSelect('all'); }, active: !geralMode && isAllMode },
                            { label: 'Semana', icon: 'person',         action: () => { setGeralMode(false); if (selectedProfessionalId === 'all' || !selectedProfessionalId) handleProfessionalSelect(professionals[0]?.id ?? 'all'); }, active: !geralMode && !isAllMode },
                        ].map(({ label, icon, action, active }) => (
                            <button
                                key={label}
                                onClick={action}
                                className="px-3.5 py-2 text-[12px] font-bold transition-colors flex items-center gap-1.5"
                                style={active
                                    ? { background: '#6366f1', color: '#ffffff' }
                                    : { color: '#6b7280', background: 'transparent' }
                                }
                            >
                                <span className="material-symbols-outlined text-sm">{icon}</span>
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Novo agendamento */}
                    <button
                        onClick={() => setShowModal(true)}
                        disabled={geralMode}
                        className="px-4 py-2 rounded-xl font-black flex items-center gap-1.5 transition-all text-[13px]"
                        style={geralMode
                            ? { background: '#f3f4f6', color: '#9ca3af', cursor: 'not-allowed' }
                            : { background: '#6366f1', color: '#fff', boxShadow: '0 4px 14px rgba(99,102,241,0.35)' }
                        }
                    >
                        <span className="material-symbols-outlined text-base">add</span>
                        Novo Agendamento
                    </button>
                </div>
            </section>

            {/* Horizontal Date Selector */}
            <section className={`rounded-2xl p-2 border border-outline-variant/20 mt-4 relative ${geralMode ? 'hidden' : ''}`} style={{ background: '#ffffff' }}>
                <div className="flex items-center gap-1">
                    <button
                        onClick={handlePrevWeek}
                        className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-all shrink-0"
                        title="Semana Anterior"
                    >
                        <span className="material-symbols-outlined text-lg">chevron_left</span>
                    </button>

                    <div className="flex-1 flex items-center justify-between gap-1 overflow-x-auto no-scrollbar py-1">
                        {weekDays.map((day) => {
                            const active = isSameDay(day, parseISO(selectedDate));
                            const isToday = isSameDay(day, new Date());
                            return (
                                <button
                                    key={day.toString()}
                                    onClick={() => handleDateSelect(day)}
                                    className={`flex-1 min-w-[64px] flex flex-col items-center py-2.5 px-2 rounded-xl transition-all relative ${active ? 'shadow-md scale-105 z-10' : 'hover:bg-gray-50'}`}
                                    style={active ? { background: '#6366f1', color: '#fff' } : { color: '#6b7280' }}
                                >
                                    <span className="text-[10px] font-bold uppercase tracking-wider mb-1 opacity-80">
                                        {format(day, 'EEE', { locale: ptBR })}
                                    </span>
                                    <span className="text-xl font-black tabular-nums">{format(day, 'dd')}</span>
                                    {isToday && !active && (
                                        <span className="absolute bottom-1.5 w-1 h-1 rounded-full bg-indigo-400" />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    <button
                        onClick={handleNextWeek}
                        className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-all shrink-0"
                        title="Próxima Semana"
                    >
                        <span className="material-symbols-outlined text-lg">chevron_right</span>
                    </button>
                </div>
            </section>

            {/* Professional Filters */}
            <section className="p-4 rounded-2xl flex flex-col gap-3 mt-4 border border-outline-variant/20" style={{ background: '#ffffff' }}>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Profissional</span>
                <div className="flex flex-wrap gap-2">
                    {professionals.map(p => {
                        const isActive = selectedProfessionalId == p.id;
                        const color = p.color || '#6366f1';
                        return (
                            <button
                                key={p.id}
                                onClick={() => handleProfessionalSelect(p.id)}
                                className="flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer transition-all border font-semibold text-sm"
                                style={isActive
                                    ? { background: color, color: '#fff', border: `1.5px solid ${color}`, boxShadow: `0 4px 14px ${color}40` }
                                    : { background: color + '0d', color: '#374151', border: `1.5px solid ${color}25` }
                                }
                            >
                                <div
                                    className="w-7 h-7 rounded-full flex items-center justify-center font-black text-xs flex-shrink-0"
                                    style={isActive
                                        ? { background: 'rgba(255,255,255,0.25)', color: '#fff' }
                                        : { background: color + '25', color }
                                    }
                                >
                                    {p.name.charAt(0).toUpperCase()}
                                </div>
                                <span>{p.nickname || p.name}</span>
                                {isActive && (
                                    <span className="material-symbols-outlined text-base opacity-80">check</span>
                                )}
                            </button>
                        );
                    })}
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
                                <div className="bg-surface-container-low flex flex-col" style={{ height: slotMinHeight }}>
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
                                            style={{ height: slotMinHeight - 8 }}
                                        >
                                            <span className="material-symbols-outlined text-outline/30 group-hover:text-primary transition-colors">add</span>
                                        </div>
                                    ) : (
                                        hourObj.appointments.map(app => {
                                            const specColor = app.specialty?.color || '#6366f1';
                                            const isCanceled = app.status === 'cancelado';
                                            return (
                                                <AppointmentCard
                                                    key={app.id}
                                                    app={app}
                                                    specColor={specColor}
                                                    isCanceled={isCanceled}
                                                    cardHeight={slotMinHeight - 8}
                                                    onEdit={() => { setSelectedAppointment(app); setShowModal(true); }}
                                                    onDelete={() => {
                                                        if (confirm('Tem certeza que deseja excluir este agendamento?')) {
                                                            router.delete(route('appointments.destroy', app.id));
                                                        }
                                                    }}
                                                />
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
