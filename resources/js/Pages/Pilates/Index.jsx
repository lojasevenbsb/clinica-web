import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import axios from 'axios';

/* ─── helpers ─────────────────────────────────────────────────────────── */
const fmt = (d) => d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '—';
const money = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const STATUS_PKG = {
    active:    { label: 'Ativo',      cls: 'bg-emerald-100 text-emerald-700' },
    inactive:  { label: 'Inativo',    cls: 'bg-stone-100 text-stone-500' },
    cancelled: { label: 'Cancelado',  cls: 'bg-red-100 text-red-600' },
};

const STATUS_APT = {
    pendente:   { label: 'Pendente',   cls: 'bg-amber-100 text-amber-700' },
    confirmado: { label: 'Confirmado', cls: 'bg-blue-100 text-blue-700' },
    atendido:   { label: 'Atendido',   cls: 'bg-emerald-100 text-emerald-700' },
    cancelado:  { label: 'Cancelado',  cls: 'bg-red-100 text-red-500' },
};

/* ─── sub-component: barra de presença ───────────────────────────────── */
function AttendanceBar({ attended, scheduled }) {
    const pct = scheduled > 0 ? Math.round((attended / scheduled) * 100) : 0;
    const color = pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-400' : 'bg-red-400';
    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 bg-stone-100 rounded-full h-1.5 overflow-hidden">
                <div className={`${color} h-full rounded-full transition-all`} style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs text-stone-500 whitespace-nowrap">{attended}/{scheduled}</span>
        </div>
    );
}

/* ─── sub-component: linha expandível ────────────────────────────────── */
function StudentRow({ student }) {
    const [open, setOpen] = useState(false);
    const [tab, setTab] = useState('mensalidades'); // 'mensalidades' | 'presenca'
    const [installments, setInstallments] = useState(student.installments);
    const [toggling, setToggling] = useState(null);

    const togglePaid = (inst) => {
        setToggling(inst.id);
        axios.patch(route('installments.toggle', inst.id))
            .then(res => {
                setInstallments(prev => prev.map(i => i.id === inst.id ? { ...i, paid: res.data.paid } : i));
            })
            .finally(() => setToggling(null));
    };

    const pkg = STATUS_PKG[student.status] ?? { label: student.status, cls: 'bg-stone-100 text-stone-500' };
    const paidCount    = installments.filter(i => i.paid).length;
    const pendingCount = installments.filter(i => !i.paid).length;

    return (
        <>
            <tr
                className="hover:bg-stone-50/60 transition-colors cursor-pointer"
                onClick={() => setOpen(o => !o)}
            >
                {/* Aluno */}
                <td className="px-5 py-4">
                    <div className="font-bold text-stone-800">{student.patient.name}</div>
                    {student.patient.phone && (
                        <div className="text-xs text-stone-400 flex items-center gap-1 mt-0.5">
                            <span className="material-symbols-outlined" style={{ fontSize: 12 }}>phone</span>
                            {student.patient.phone}
                        </div>
                    )}
                </td>
                {/* Plano */}
                <td className="px-5 py-4">
                    <div className="text-sm font-semibold text-stone-700">{student.package.name}</div>
                    {student.price && <div className="text-xs text-stone-400">{money(student.price)}</div>}
                </td>
                {/* Profissional */}
                <td className="px-5 py-4">
                    {student.professional
                        ? <div className="text-sm text-stone-700 font-medium">{student.professional}</div>
                        : <span className="text-xs text-stone-300">—</span>
                    }
                </td>
                {/* Período */}
                <td className="px-5 py-4">
                    <div className="text-xs text-stone-400 mb-0.5">Início</div>
                    <div className="text-sm text-stone-600">{fmt(student.start_date)}</div>
                    <div className="text-xs text-stone-400 mt-1">Término</div>
                    <div className="text-sm text-stone-600">{student.end_date ? fmt(student.end_date) : <span className="text-stone-300">Sem término</span>}</div>
                </td>
                {/* Mensalidades */}
                <td className="px-5 py-4">
                    {installments.length > 0 ? (
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">{paidCount} pagas</span>
                            {pendingCount > 0 && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">{pendingCount} pendente{pendingCount > 1 ? 's' : ''}</span>
                            )}
                        </div>
                    ) : (
                        <span className="text-xs text-stone-400">Sem parcelas</span>
                    )}
                </td>
                {/* Presença */}
                <td className="px-5 py-4 min-w-[140px]">
                    <AttendanceBar
                        attended={student.attendance.attended}
                        scheduled={student.attendance.scheduled}
                    />
                </td>
                {/* Status */}
                <td className="px-5 py-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${pkg.cls}`}>{pkg.label}</span>
                </td>
                {/* Expand icon */}
                <td className="px-4 py-4 text-right">
                    <span className={`material-symbols-outlined text-stone-400 transition-transform ${open ? 'rotate-180' : ''}`} style={{ fontSize: 20 }}>
                        expand_more
                    </span>
                </td>
            </tr>

            {/* Painel expandido */}
            {open && (
                <tr>
                    <td colSpan={7} className="px-0 py-0 bg-[#f8faf9]">
                        <div className="px-6 py-5 border-t border-stone-100">
                            {/* Tabs */}
                            <div className="flex gap-1 mb-4 border-b border-stone-200">
                                {[['mensalidades', 'Mensalidades', 'payments'], ['presenca', 'Presença', 'how_to_reg']].map(([key, label, icon]) => (
                                    <button
                                        key={key}
                                        onClick={(e) => { e.stopPropagation(); setTab(key); }}
                                        className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold border-b-2 transition-colors -mb-px ${tab === key ? 'border-[#466250] text-[#466250]' : 'border-transparent text-stone-400 hover:text-stone-600'}`}
                                    >
                                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{icon}</span>
                                        {label}
                                    </button>
                                ))}
                            </div>

                            {/* Tab: Mensalidades */}
                            {tab === 'mensalidades' && (
                                installments.length === 0 ? (
                                    <p className="text-sm text-stone-400 text-center py-6">Nenhuma mensalidade registrada.</p>
                                ) : (
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                        {installments.map(inst => {
                                            const overdue = !inst.paid && new Date(inst.due_date) < new Date();
                                            return (
                                                <div
                                                    key={inst.id}
                                                    className={`rounded-xl border p-3 flex flex-col gap-2 ${inst.paid ? 'bg-emerald-50 border-emerald-200' : overdue ? 'bg-red-50 border-red-200' : 'bg-white border-stone-200'}`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-bold text-stone-500">Parcela {inst.numero}</span>
                                                        {inst.paid
                                                            ? <span className="material-symbols-outlined text-emerald-500" style={{ fontSize: 16 }}>check_circle</span>
                                                            : overdue
                                                                ? <span className="material-symbols-outlined text-red-400" style={{ fontSize: 16 }}>warning</span>
                                                                : <span className="material-symbols-outlined text-amber-400" style={{ fontSize: 16 }}>schedule</span>
                                                        }
                                                    </div>
                                                    <div className="text-sm font-bold text-stone-700">{money(inst.amount)}</div>
                                                    <div className="text-xs text-stone-400">Venc. {fmt(inst.due_date)}</div>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); togglePaid(inst); }}
                                                        disabled={toggling === inst.id}
                                                        className={`mt-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${inst.paid ? 'bg-stone-100 text-stone-500 hover:bg-red-50 hover:text-red-500' : 'bg-[#466250] text-white hover:bg-[#384f40]'}`}
                                                    >
                                                        {toggling === inst.id ? '...' : inst.paid ? 'Desfazer' : 'Marcar pago'}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )
                            )}

                            {/* Tab: Presença */}
                            {tab === 'presenca' && (
                                student.attendance.list.length === 0 ? (
                                    <p className="text-sm text-stone-400 text-center py-6">Nenhum agendamento registrado.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {/* Barra de resumo de presença */}
                                        <div className="flex items-center gap-4 mb-4 p-3 bg-white rounded-xl border border-stone-200">
                                            {[
                                                { label: 'Total', count: student.attendance.total, cls: 'text-stone-700' },
                                                { label: 'Atendidos', count: student.attendance.attended, cls: 'text-emerald-600' },
                                                { label: 'Pendentes', count: student.attendance.list.filter(a => a.status === 'pendente' || a.status === 'confirmado').length, cls: 'text-amber-600' },
                                                { label: 'Cancelados', count: student.attendance.list.filter(a => a.status === 'cancelado').length, cls: 'text-red-500' },
                                            ].map(({ label, count, cls }) => (
                                                <div key={label} className="flex flex-col items-center min-w-[60px]">
                                                    <span className={`text-xl font-bold ${cls}`}>{count}</span>
                                                    <span className="text-xs text-stone-400">{label}</span>
                                                </div>
                                            ))}
                                            <div className="flex-1 ml-2">
                                                <AttendanceBar
                                                    attended={student.attendance.attended}
                                                    scheduled={student.attendance.scheduled}
                                                />
                                                <p className="text-xs text-stone-400 mt-1">
                                                    {student.attendance.scheduled > 0
                                                        ? `${Math.round(student.attendance.attended / student.attendance.scheduled * 100)}% de presença`
                                                        : 'Sem agendamentos'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Lista de aulas */}
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                            {student.attendance.list.map((a, idx) => {
                                                const st = STATUS_APT[a.status] ?? { label: a.status, cls: 'bg-stone-100 text-stone-500' };
                                                const d = new Date(a.start_time);
                                                return (
                                                    <div key={a.id} className="flex items-center gap-3 bg-white rounded-xl border border-stone-100 px-3 py-2">
                                                        <div className="text-center min-w-[36px]">
                                                            <div className="text-lg font-bold text-stone-700 leading-none">{String(d.getDate()).padStart(2,'0')}</div>
                                                            <div className="text-[10px] text-stone-400 uppercase">{d.toLocaleDateString('pt-BR', { month: 'short' })}</div>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-xs text-stone-500">{d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${st.cls}`}>{st.label}</span>
                                                            {a.professional && (
                                                                <div className="text-[10px] text-stone-400 truncate mt-0.5">{a.professional}</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}

/* ─── página principal ───────────────────────────────────────────────── */
export default function PilatesIndex({ students, summary, filters }) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || 'all');

    useEffect(() => {
        const t = setTimeout(() => {
            router.get(route('pilates.index'), { search, status: status === 'all' ? '' : status }, {
                preserveState: true,
                replace: true,
            });
        }, 300);
        return () => clearTimeout(t);
    }, [search, status]);

    return (
        <AuthenticatedLayout>
            <Head title="Controle de Pilates" />

            {/* Header */}
            <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-[#466250] mb-1">Controle de Pilates</h1>
                    <p className="text-stone-500">Acompanhe planos, mensalidades e presença dos alunos.</p>
                </div>
            </section>

            {/* Cards de resumo */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                    { label: 'Total de Alunos',       value: summary.total,                icon: 'group',           bg: 'bg-stone-50',    text: 'text-stone-700' },
                    { label: 'Alunos Ativos',          value: summary.active,               icon: 'how_to_reg',      bg: 'bg-emerald-50',  text: 'text-emerald-700' },
                    { label: 'Mensalidades Pendentes', value: summary.pending_installments, icon: 'payments',        bg: 'bg-amber-50',    text: 'text-amber-700' },
                    { label: 'Taxa de Presença',       value: `${summary.attendance_rate}%`,icon: 'self_improvement', bg: 'bg-blue-50',    text: 'text-blue-700' },
                ].map(({ label, value, icon, bg, text }) => (
                    <div key={label} className={`${bg} rounded-2xl p-5 flex items-center gap-4`}>
                        <div className={`p-2 rounded-xl bg-white shadow-sm`}>
                            <span className={`material-symbols-outlined ${text}`}>{icon}</span>
                        </div>
                        <div>
                            <div className={`text-2xl font-extrabold ${text}`}>{value}</div>
                            <div className="text-xs text-stone-400 mt-0.5">{label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filtros */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">search</span>
                    <input
                        type="text"
                        placeholder="Buscar aluno..."
                        className="pl-10 pr-4 py-2.5 bg-white border-stone-200 rounded-xl text-sm focus:ring-[#466250] focus:border-[#466250] w-full"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    {[['all', 'Todos'], ['active', 'Ativos'], ['inactive', 'Inativos'], ['cancelled', 'Cancelados']].map(([val, label]) => (
                        <button
                            key={val}
                            onClick={() => setStatus(val)}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${status === val ? 'bg-[#466250] text-white' : 'bg-white text-stone-500 border border-stone-200 hover:bg-stone-50'}`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tabela */}
            <div className="bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-stone-50 border-b border-stone-100">
                                {['Aluno', 'Plano', 'Período', 'Mensalidades', 'Presença', 'Status', ''].map(h => (
                                    <th key={h} className="px-5 py-4 text-xs font-bold text-stone-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                            {students.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center gap-3 text-stone-400">
                                            <span className="material-symbols-outlined text-5xl text-stone-300">self_improvement</span>
                                            <span>Nenhum aluno de Pilates encontrado.</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                students.map(s => <StudentRow key={s.id} student={s} />)
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
