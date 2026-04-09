import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { format, getDaysInMonth, startOfMonth, getDay, addMonths, subMonths, parseISO, isToday, isFuture } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';

const fmt = (d) => d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '—';

const STATUS_CONFIG = {
    presente:  { label: 'Presente',  bg: 'bg-emerald-500', text: 'text-white',        ring: 'ring-emerald-400', icon: 'check' },
    falta:     { label: 'Falta',     bg: 'bg-red-400',     text: 'text-white',        ring: 'ring-red-300',     icon: 'close' },
    cancelado: { label: 'Cancelado', bg: 'bg-amber-400',   text: 'text-white',        ring: 'ring-amber-300',   icon: 'event_busy' },
    feriado:   { label: 'Feriado',   bg: 'bg-violet-400',  text: 'text-white',        ring: 'ring-violet-300',  icon: 'celebration' },
};

/* ─── Barra de frequência ────────────────────────────────────────────────── */
function FreqBar({ presentes, esperado, pct }) {
    if (!esperado) return <span className="text-xs text-stone-300">Sem meta</span>;
    const color = pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-400' : 'bg-red-400';
    return (
        <div className="flex items-center gap-2 min-w-[120px]">
            <div className="flex-1 bg-stone-100 rounded-full h-2 overflow-hidden">
                <div className={`${color} h-full rounded-full transition-all`} style={{ width: `${Math.min(pct, 100)}%` }} />
            </div>
            <span className="text-xs text-stone-500 whitespace-nowrap font-bold">{presentes}/{esperado}</span>
        </div>
    );
}

/* ─── Modal Calendário do Aluno ──────────────────────────────────────────── */
function CalendarModal({ enrollmentId, month, onClose }) {
    const [data, setData]       = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving]   = useState(null);
    const [curMonth, setCurMonth] = useState(month);

    const load = useCallback(() => {
        setLoading(true);
        axios.get(route('pilates.frequencia.show', enrollmentId), { params: { month: curMonth } })
            .then(r => setData(r.data))
            .finally(() => setLoading(false));
    }, [enrollmentId, curMonth]);

    useEffect(() => { load(); }, [load]);

    const byDate = data ? Object.fromEntries(data.attendances.map(a => [a.date, a])) : {};

    const monthDate  = parseISO(curMonth + '-01');
    const totalDays  = getDaysInMonth(monthDate);
    const firstDay   = startOfMonth(monthDate);
    const startOffset = (getDay(firstDay) + 6) % 7; // Seg=0
    const cells = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= totalDays; d++) cells.push(d);

    const statusCycle = ['presente', 'falta', 'cancelado', 'feriado'];

    const handleDayClick = async (day) => {
        const dateStr = `${curMonth}-${String(day).padStart(2, '0')}`;
        const date    = parseISO(dateStr);
        if (isFuture(date) && !isToday(date)) return;

        const current = byDate[dateStr];
        const curIdx  = current ? statusCycle.indexOf(current.status) : -1;

        // Se já tem registro e clicou no último estado → remove
        if (current && curIdx === statusCycle.length - 1) {
            setSaving(dateStr);
            await axios.delete(route('pilates.frequencia.destroy', current.id));
            setData(prev => ({ ...prev, attendances: prev.attendances.filter(a => a.date !== dateStr) }));
            setSaving(null);
            return;
        }

        const nextStatus = statusCycle[curIdx + 1];
        setSaving(dateStr);
        const res = await axios.post(route('pilates.frequencia.upsert'), {
            enrollment_id: enrollmentId,
            date: dateStr,
            status: nextStatus,
        });
        setData(prev => {
            const filtered = prev.attendances.filter(a => a.date !== dateStr);
            return { ...prev, attendances: [...filtered, res.data] };
        });
        setSaving(null);
    };

    const presentes  = data?.attendances.filter(a => a.status === 'presente').length ?? 0;
    const faltas     = data?.attendances.filter(a => a.status === 'falta').length ?? 0;
    const cancelados = data?.attendances.filter(a => a.status === 'cancelado').length ?? 0;
    const esperado   = data?.enrollment.sessions_per_month ?? 0;
    const pct        = esperado > 0 ? Math.round((presentes / esperado) * 100) : null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
                {/* Header */}
                <div className="px-6 py-5 border-b border-stone-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-extrabold text-stone-800">{data?.enrollment.patient_name ?? '...'}</h2>
                        <p className="text-sm text-stone-400 capitalize mt-0.5">
                            {format(parseISO(curMonth + '-01'), "MMMM 'de' yyyy", { locale: ptBR })}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-stone-100 text-stone-400 transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Navegação mês */}
                <div className="flex items-center justify-between px-6 py-3 bg-stone-50 border-b border-stone-100">
                    <button onClick={() => setCurMonth(format(subMonths(parseISO(curMonth + '-01'), 1), 'yyyy-MM'))}
                        className="p-1.5 rounded-lg hover:bg-stone-200 transition-colors">
                        <span className="material-symbols-outlined text-stone-500">chevron_left</span>
                    </button>
                    <span className="text-sm font-bold text-stone-600 capitalize">
                        {format(parseISO(curMonth + '-01'), "MMMM yyyy", { locale: ptBR })}
                    </span>
                    <button onClick={() => setCurMonth(format(addMonths(parseISO(curMonth + '-01'), 1), 'yyyy-MM'))}
                        className="p-1.5 rounded-lg hover:bg-stone-200 transition-colors">
                        <span className="material-symbols-outlined text-stone-500">chevron_right</span>
                    </button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <span className="material-symbols-outlined animate-spin text-[#466250] text-3xl">progress_activity</span>
                    </div>
                ) : (
                    <>
                        {/* Calendário */}
                        <div className="p-4">
                            {/* Labels dias da semana */}
                            <div className="grid grid-cols-7 mb-1">
                                {['S','T','Q','Q','S','S','D'].map((d, i) => (
                                    <div key={i} className="text-center text-[10px] font-bold text-stone-400 py-1">{d}</div>
                                ))}
                            </div>
                            <div className="grid grid-cols-7 gap-1">
                                {cells.map((day, i) => {
                                    if (!day) return <div key={`e-${i}`} />;
                                    const dateStr = `${curMonth}-${String(day).padStart(2, '0')}`;
                                    const att     = byDate[dateStr];
                                    const cfg     = att ? STATUS_CONFIG[att.status] : null;
                                    const future  = isFuture(parseISO(dateStr)) && !isToday(parseISO(dateStr));
                                    const isSaving = saving === dateStr;

                                    return (
                                        <button
                                            key={day}
                                            onClick={() => handleDayClick(day)}
                                            disabled={future || isSaving}
                                            title={cfg ? cfg.label : 'Clique para registrar'}
                                            className={`
                                                aspect-square rounded-xl flex flex-col items-center justify-center text-xs font-bold transition-all
                                                ${future ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:scale-105 active:scale-95'}
                                                ${cfg ? `${cfg.bg} ${cfg.text} shadow-sm` : 'bg-stone-100 text-stone-400 hover:bg-stone-200'}
                                                ${isToday(parseISO(dateStr)) && !cfg ? 'ring-2 ring-[#466250] ring-offset-1' : ''}
                                            `}
                                        >
                                            {isSaving
                                                ? <span className="material-symbols-outlined text-xs animate-spin">progress_activity</span>
                                                : <>
                                                    <span>{day}</span>
                                                    {cfg && <span className="material-symbols-outlined" style={{ fontSize: 10 }}>{cfg.icon}</span>}
                                                </>
                                            }
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Legenda */}
                        <div className="px-4 pb-2 flex flex-wrap gap-2">
                            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                                <span key={k} className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${v.bg} ${v.text}`}>{v.label}</span>
                            ))}
                            <span className="text-[10px] text-stone-400 ml-1">· Clique para alternar · Último estado limpa o dia</span>
                        </div>

                        {/* Resumo do mês */}
                        <div className="mx-4 mb-4 mt-1 bg-stone-50 rounded-2xl px-4 py-3 grid grid-cols-4 gap-2 text-center border border-stone-100">
                            {[
                                { label: 'Presentes',  value: presentes,  color: 'text-emerald-600' },
                                { label: 'Faltas',     value: faltas,     color: 'text-red-500' },
                                { label: 'Cancelados', value: cancelados, color: 'text-amber-600' },
                                { label: 'Frequência', value: pct !== null ? `${pct}%` : '—', color: pct >= 75 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-red-500' },
                            ].map(({ label, value, color }) => (
                                <div key={label}>
                                    <div className={`text-xl font-extrabold ${color}`}>{value}</div>
                                    <div className="text-[10px] text-stone-400">{label}</div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

/* ─── Página principal ───────────────────────────────────────────────────── */
export default function Frequencia({ students, month, month_label }) {
    const [search, setSearch]       = useState('');
    const [openModal, setOpenModal] = useState(null); // enrollmentId
    const [curMonth, setCurMonth]   = useState(month);

    const changeMonth = (dir) => {
        const base = parseISO(curMonth + '-01');
        const next = dir === 'prev' ? subMonths(base, 1) : addMonths(base, 1);
        const m    = format(next, 'yyyy-MM');
        setCurMonth(m);
        router.get(route('pilates.frequencia'), { month: m }, { preserveState: true, replace: true });
    };

    const filtered = students.filter(s =>
        s.patient_name?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <AuthenticatedLayout>
            <Head title="Controle de Frequência — Pilates" />

            {/* Header */}
            <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-[#466250] mb-1">Controle de Frequência</h1>
                    <p className="text-stone-500 capitalize">{month_label} · {students.length} aluno{students.length !== 1 ? 's' : ''} ativo{students.length !== 1 ? 's' : ''}</p>
                </div>
                {/* Navegação mês */}
                <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-xl px-3 py-1.5 shadow-sm">
                    <button onClick={() => changeMonth('prev')} className="p-1 rounded-lg hover:bg-stone-100 transition-colors">
                        <span className="material-symbols-outlined text-stone-500">chevron_left</span>
                    </button>
                    <span className="text-sm font-bold text-stone-700 capitalize px-2 min-w-[140px] text-center">{month_label}</span>
                    <button onClick={() => changeMonth('next')} className="p-1 rounded-lg hover:bg-stone-100 transition-colors">
                        <span className="material-symbols-outlined text-stone-500">chevron_right</span>
                    </button>
                </div>
            </section>

            {/* Busca */}
            <div className="relative mb-6 max-w-sm">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">search</span>
                <input
                    type="text"
                    placeholder="Buscar aluno..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:ring-[#466250] focus:border-[#466250] w-full outline-none"
                />
            </div>

            {/* Tabela */}
            <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-stone-50 border-b border-stone-100">
                                {['Aluno', 'Plano', 'Frequência do Mês', 'Faltas', 'Última Presença', 'Situação', ''].map(h => (
                                    <th key={h} className="px-5 py-3 text-xs font-bold text-stone-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-16 text-center text-stone-400 text-sm">Nenhum aluno encontrado</td>
                                </tr>
                            ) : filtered.map(s => {
                                const pct = s.pct;
                                const badgeColor = pct === null ? 'bg-stone-100 text-stone-400'
                                    : pct >= 75 ? 'bg-emerald-100 text-emerald-700'
                                    : pct >= 50 ? 'bg-amber-100 text-amber-700'
                                    : 'bg-red-100 text-red-600';

                                return (
                                    <tr key={s.enrollment_id} className="hover:bg-stone-50/60 transition-colors">
                                        <td className="px-5 py-4">
                                            <p className="font-bold text-stone-800 text-sm">{s.patient_name}</p>
                                            {s.patient_phone && <p className="text-xs text-stone-400">{s.patient_phone}</p>}
                                        </td>
                                        <td className="px-5 py-4 text-sm text-stone-600">{s.package_name ?? <span className="text-stone-300">—</span>}</td>
                                        <td className="px-5 py-4">
                                            <FreqBar presentes={s.presentes} esperado={s.esperado} pct={pct ?? 0} />
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${s.faltas > 0 ? 'bg-red-100 text-red-600' : 'bg-stone-100 text-stone-400'}`}>
                                                {s.faltas}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-sm text-stone-500">{fmt(s.ultima_presenca)}</td>
                                        <td className="px-5 py-4">
                                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${badgeColor}`}>
                                                {pct === null ? 'Sem meta' : `${pct}%`}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <button
                                                onClick={() => setOpenModal(s.enrollment_id)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#466250] bg-[#466250]/8 hover:bg-[#466250]/15 rounded-xl transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-base">calendar_month</span>
                                                Ver calendário
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal calendário */}
            {openModal && (
                <CalendarModal
                    enrollmentId={openModal}
                    month={curMonth}
                    onClose={() => setOpenModal(null)}
                />
            )}
        </AuthenticatedLayout>
    );
}
