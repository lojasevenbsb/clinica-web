import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import AppointmentModal from '@/Components/AppointmentModal';
import { format, addDays, startOfWeek, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';

export default function Agenda({ professionals, patients, specialties, appointments, professionalHours, filters }) {
    const [showModal, setShowModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState(filters.date);
    const [selectedProfessionalId, setSelectedProfessionalId] = useState(filters.professional_id);

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

    const handleProfessionalSelect = (id) => {
        setSelectedProfessionalId(id);
        router.get(route('agenda'), { 
            date: selectedDate,
            professional_id: id 
        }, { preserveState: true });
    };

    const selectedProfessional = professionals.find(p => p.id == selectedProfessionalId);

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
                <label className="text-xs font-bold text-primary tracking-widest uppercase">Selecionar Profissional</label>
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
            <section className="bg-surface-container-lowest rounded-2xl p-2 border border-outline-variant/30 overflow-hidden mt-4">
                <div className="flex items-center justify-between gap-1 overflow-x-auto no-scrollbar py-1">
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
            </section>

            {/* Grid Agenda Section */}
            <section className="space-y-1 mt-4">
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
                                <span className="text-xs font-bold text-outline uppercase tracking-widest">Atendimentos de {selectedProfessional?.name}</span>
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
                                        hourObj.appointments.map(app => (
                                            <div 
                                                key={app.id} 
                                                className="min-w-[250px] flex-1 bg-primary/5 border border-primary/20 border-l-4 border-l-primary rounded-xl p-3 flex flex-col justify-between min-h-[90px] shadow-sm relative group"
                                            >
                                                <div>
                                                    <div className="flex items-start justify-between mb-1">
                                                        <h3 className="font-bold text-sm text-on-surface">{app.patient.name}</h3>
                                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={() => router.delete(route('appointments.destroy', app.id))} className="p-1 hover:bg-red-50 rounded text-red-500">
                                                                <span className="material-symbols-outlined text-xs">delete</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <span className="text-[10px] text-on-primary-fixed-variant bg-primary-fixed px-2 py-0.5 rounded-full font-bold">
                                                        {format(parseISO(app.start_time), 'HH:mm')} - {format(parseISO(app.end_time), 'HH:mm')}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between mt-2">
                                                    <span className="text-[10px] text-outline font-bold uppercase tracking-wider">{app.specialty.name}</span>
                                                    <span className="text-[10px] font-extrabold text-primary uppercase">{app.status}</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        ))}
                    </>
                )}
            </section>

            <AppointmentModal 
                show={showModal} 
                onClose={() => setShowModal(false)}
                professionals={professionals}
                patients={patients}
                specialties={specialties}
                professionalHours={professionalHours}
                selectedDate={selectedDate}
                selectedProfessionalId={selectedProfessionalId}
            />
        </AuthenticatedLayout>
    );
}
