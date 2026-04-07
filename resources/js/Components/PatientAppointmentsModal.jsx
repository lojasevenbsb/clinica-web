import Modal from '@/Components/Modal';
import { useState, useEffect } from 'react';
import axios from 'axios';

const STATUS_LABELS = {
    pendente:   { label: 'Pendente',   color: 'bg-amber-100 text-amber-700' },
    confirmado: { label: 'Confirmado', color: 'bg-emerald-100 text-emerald-700' },
    atendido:   { label: 'Atendido',   color: 'bg-blue-100 text-blue-700' },
    cancelado:  { label: 'Cancelado',  color: 'bg-red-100 text-red-700' },
};

const STATUS_SUMMARY = [
    { key: 'pendente',   label: 'Pendentes',   card: 'bg-amber-50',   text: 'text-amber-600' },
    { key: 'confirmado', label: 'Confirmados', card: 'bg-emerald-50', text: 'text-emerald-600' },
    { key: 'atendido',   label: 'Atendidos',   card: 'bg-blue-50',    text: 'text-blue-600' },
    { key: 'cancelado',  label: 'Cancelados',  card: 'bg-red-50',     text: 'text-red-500' },
];

function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatTime(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export default function PatientAppointmentsModal({ show, onClose, patient, onSchedule }) {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState('all'); // 'all' | status key

    useEffect(() => {
        if (!show || !patient) return;
        setLoading(true);
        axios.get(route('patients.appointments', patient.id))
            .then(res => setAppointments(res.data))
            .finally(() => setLoading(false));
    }, [show, patient]);

    const filtered = filter === 'all'
        ? appointments
        : appointments.filter(a => a.status === filter);

    const countByStatus = (key) => appointments.filter(a => a.status === key).length;

    return (
        <Modal show={show} onClose={onClose} maxWidth="2xl">
            <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-xl">
                            <span className="material-symbols-outlined text-orange-500">calendar_month</span>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-stone-800">Agendamentos</h2>
                            {patient && <p className="text-sm text-stone-400">{patient.name}</p>}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => { onClose(); onSchedule?.(patient); }}
                            className="flex items-center gap-1.5 px-4 py-2 bg-[#466250] text-white text-sm font-semibold rounded-xl hover:bg-[#384f40] transition-colors"
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
                            Agendar
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-lg transition-colors">
                            <span className="material-symbols-outlined text-stone-400">close</span>
                        </button>
                    </div>
                </div>

                {/* Resumo + Filtro por status */}
                <div className="grid grid-cols-5 gap-2 mb-5">
                    <button
                        onClick={() => setFilter('all')}
                        className={`rounded-xl p-3 text-center transition-all border-2 ${filter === 'all' ? 'border-stone-400 bg-stone-100' : 'border-transparent bg-stone-50 hover:bg-stone-100'}`}
                    >
                        <div className="text-2xl font-bold text-stone-700">{appointments.length}</div>
                        <div className="text-xs text-stone-400 mt-0.5">Total</div>
                    </button>
                    {STATUS_SUMMARY.map(({ key, label, card, text }) => (
                        <button
                            key={key}
                            onClick={() => setFilter(filter === key ? 'all' : key)}
                            className={`rounded-xl p-3 text-center transition-all border-2 ${filter === key ? 'border-current ' + text : 'border-transparent'} ${card} hover:opacity-90`}
                        >
                            <div className={`text-2xl font-bold ${text}`}>{countByStatus(key)}</div>
                            <div className="text-xs text-stone-400 mt-0.5">{label}</div>
                        </button>
                    ))}
                </div>

                {/* Lista */}
                <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                    {loading ? (
                        <div className="flex justify-center py-10">
                            <span className="material-symbols-outlined animate-spin text-orange-400">progress_activity</span>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center py-10 text-stone-400 gap-2">
                            <span className="material-symbols-outlined text-4xl text-stone-300">event_busy</span>
                            <span className="text-sm">Nenhum agendamento encontrado.</span>
                        </div>
                    ) : (
                        filtered.map(a => {
                            const status = STATUS_LABELS[a.status] ?? { label: a.status, color: 'bg-stone-100 text-stone-600' };
                            return (
                                <div
                                    key={a.id}
                                    className="flex items-start gap-3 p-3 rounded-xl border border-stone-100 bg-stone-50 transition-colors"
                                >
                                    <div className="flex flex-col items-center min-w-[52px] bg-white rounded-lg border border-stone-200 p-1.5 text-center shadow-sm">
                                        <span className="text-xs text-stone-400 leading-none">{formatDate(a.start_time).slice(3,10).replace('/','\n')}</span>
                                        <span className="text-sm font-bold text-stone-700 leading-tight">{formatDate(a.start_time).slice(0,2)}</span>
                                        <span className="text-xs text-stone-500">{formatTime(a.start_time)}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-semibold text-stone-700 text-sm">{a.specialty ?? '—'}</span>
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.color}`}>{status.label}</span>
                                        </div>
                                        <div className="text-xs text-stone-400 mt-0.5 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-xs" style={{fontSize:'12px'}}>person</span>
                                            {a.professional ?? '—'}
                                        </div>
                                        {a.package && (
                                            <div className="text-xs text-emerald-600 mt-0.5 flex items-center gap-1">
                                                <span className="material-symbols-outlined" style={{fontSize:'12px'}}>inventory_2</span>
                                                {a.package}
                                            </div>
                                        )}
                                        {a.notes && (
                                            <div className="text-xs text-stone-400 mt-0.5 truncate">{a.notes}</div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </Modal>
    );
}
