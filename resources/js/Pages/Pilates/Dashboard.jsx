import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

const money = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmt   = (d) => d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '—';

/* ─── Barra CSS simples ─────────────────────────────────────────────────── */
function BarChart({ data, valueKey, labelKey, color = '#466250' }) {
    const max = Math.max(...data.map(d => d[valueKey]), 1);
    return (
        <div className="flex items-end gap-2 h-32 mt-2">
            {data.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[9px] text-stone-400 font-bold">
                        {typeof d[valueKey] === 'number' && d[valueKey] > 999
                            ? `R$${(d[valueKey]/1000).toFixed(1)}k`
                            : d[valueKey]}
                    </span>
                    <div
                        className="w-full rounded-t-lg transition-all"
                        style={{ height: `${Math.max((d[valueKey] / max) * 100, 4)}%`, backgroundColor: color + 'cc' }}
                    />
                    <span className="text-[9px] text-stone-400 truncate w-full text-center">{d[labelKey]}</span>
                </div>
            ))}
        </div>
    );
}

/* ─── Card KPI ──────────────────────────────────────────────────────────── */
function KpiCard({ label, value, icon, bg, text, sub }) {
    return (
        <div className={`${bg} rounded-2xl p-5 flex items-center gap-4`}>
            <div className="p-2.5 rounded-xl bg-white shadow-sm shrink-0">
                <span className={`material-symbols-outlined ${text}`} style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
            </div>
            <div className="min-w-0">
                <div className={`text-2xl font-extrabold ${text} truncate`}>{value}</div>
                <div className="text-xs text-stone-400 mt-0.5 leading-tight">{label}</div>
                {sub && <div className="text-[10px] text-stone-300 mt-0.5">{sub}</div>}
            </div>
        </div>
    );
}

export default function PilatesDashboard({ kpis, vencendo_mes, atrasadas, por_plano, receita_meses, novas_meses, alunos_ativos }) {
    return (
        <AuthenticatedLayout>
            <Head title="Dashboard Pilates" />

            {/* Header */}
            <section className="flex items-end justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-[#466250] mb-1">Dashboard — Pilates</h1>
                    <p className="text-stone-500">Visão geral das matrículas, receita e alunos.</p>
                </div>
                <Link
                    href={route('pilates.matriculas.index')}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#466250] text-white rounded-xl font-bold text-sm hover:bg-[#384f40] transition-colors shadow-lg shadow-[#466250]/20"
                >
                    <span className="material-symbols-outlined text-base">assignment</span>
                    Ver Matrículas
                </Link>
            </section>

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                <KpiCard label="Alunos Ativos"        value={kpis.ativos}          icon="how_to_reg"    bg="bg-emerald-50"  text="text-emerald-700" />
                <KpiCard label="Receita do Mês"       value={money(kpis.receita_mes)}   icon="trending_up"   bg="bg-blue-50"     text="text-blue-700" />
                <KpiCard label="A Receber no Mês"     value={money(kpis.a_receber_mes)} icon="payments"      bg="bg-amber-50"    text="text-amber-700" />
                <KpiCard label="Inadimplentes"        value={kpis.inadimplentes}   icon="warning"       bg="bg-red-50"      text="text-red-600"   sub="com parcela vencida" />
                <KpiCard label="Vencendo este Mês"    value={kpis.vencendo_mes}    icon="event_busy"    bg="bg-orange-50"   text="text-orange-600" sub="contratos a renovar" />
                <KpiCard label="Novos este Mês"       value={kpis.novos_mes}       icon="person_add"    bg="bg-violet-50"   text="text-violet-700" />
            </div>

            {/* Linha 2 — Gráficos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* Receita mensal */}
                <div className="md:col-span-2 bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
                    <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">Receita Paga — Últimos 6 Meses</p>
                    <BarChart data={receita_meses} valueKey="valor" labelKey="mes" color="#466250" />
                </div>

                {/* Distribuição por plano */}
                <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
                    <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">Alunos por Plano</p>
                    {por_plano.length === 0 ? (
                        <p className="text-sm text-stone-300 text-center py-6">Sem dados</p>
                    ) : (
                        <div className="space-y-3">
                            {por_plano.map((p, i) => {
                                const max = Math.max(...por_plano.map(x => x.count), 1);
                                return (
                                    <div key={i}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs text-stone-600 font-medium truncate max-w-[140px]">{p.name}</span>
                                            <span className="text-xs font-bold text-[#466250]">{p.count}</span>
                                        </div>
                                        <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-[#466250]/70 transition-all"
                                                style={{ width: `${(p.count / max) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Linha 3 — Novas matrículas + Alertas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Novas matrículas */}
                <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
                    <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">Novas Matrículas — Últimos 6 Meses</p>
                    <BarChart data={novas_meses} valueKey="count" labelKey="mes" color="#7c3aed" />
                </div>

                {/* Parcelas em atraso */}
                <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">Parcelas em Atraso</p>
                        {atrasadas.length > 0 && (
                            <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">{atrasadas.length}</span>
                        )}
                    </div>
                    {atrasadas.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 gap-2">
                            <span className="material-symbols-outlined text-emerald-400 text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                            <p className="text-sm text-stone-400">Nenhuma parcela em atraso</p>
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                            {atrasadas.map(a => (
                                <div key={a.id} className="flex items-center justify-between px-3 py-2.5 bg-red-50 rounded-xl border border-red-100">
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-stone-700 truncate">{a.patient}</p>
                                        <p className="text-xs text-red-500">Venc. {fmt(a.due_date)} · {a.dias_atraso}d atraso</p>
                                    </div>
                                    <span className="text-sm font-bold text-red-600 shrink-0 ml-3">{money(a.amount)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Linha 4 — Vencendo este mês */}
            {vencendo_mes.length > 0 && (
                <div className="bg-orange-50 rounded-2xl border border-orange-200 p-5 mb-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="material-symbols-outlined text-orange-500" style={{ fontVariationSettings: "'FILL' 1" }}>event_busy</span>
                        <p className="text-sm font-bold text-orange-700">Contratos vencendo este mês — {vencendo_mes.length} aluno{vencendo_mes.length !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {vencendo_mes.map(v => (
                            <div key={v.id} className="bg-white rounded-xl border border-orange-100 px-4 py-3 flex items-center justify-between">
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-stone-700 truncate">{v.patient}</p>
                                    <p className="text-xs text-stone-400">{v.package ?? '—'}</p>
                                </div>
                                <div className="text-right shrink-0 ml-3">
                                    <p className="text-xs font-bold text-orange-600">{fmt(v.end_date)}</p>
                                    <p className="text-xs text-stone-400">{money(v.price)}/mês</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Linha 5 — Todos os alunos ativos */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
                    <p className="font-bold text-stone-700">Alunos Ativos <span className="text-stone-400 font-normal text-sm">({alunos_ativos.length})</span></p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-stone-50 border-b border-stone-100">
                                {['Aluno', 'Plano', 'Valor', 'Próx. Vencimento', 'Forma Pgto', 'Situação'].map(h => (
                                    <th key={h} className="px-5 py-3 text-xs font-bold text-stone-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                            {alunos_ativos.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-stone-400 text-sm">Nenhum aluno ativo</td>
                                </tr>
                            ) : alunos_ativos.map(a => (
                                <tr key={a.id} className="hover:bg-stone-50/60 transition-colors">
                                    <td className="px-5 py-3">
                                        <p className="font-bold text-stone-800 text-sm">{a.patient}</p>
                                        {a.phone && <p className="text-xs text-stone-400">{a.phone}</p>}
                                    </td>
                                    <td className="px-5 py-3 text-sm text-stone-600">{a.package ?? <span className="text-stone-300">—</span>}</td>
                                    <td className="px-5 py-3 text-sm font-bold text-stone-700">{money(a.price)}</td>
                                    <td className="px-5 py-3">
                                        {a.proxima_parcela
                                            ? <span className="text-sm text-stone-600">{fmt(a.proxima_parcela)}</span>
                                            : <span className="text-xs text-stone-300">Sem parcelas</span>}
                                    </td>
                                    <td className="px-5 py-3 text-xs text-stone-500">{a.payment_method ?? '—'}</td>
                                    <td className="px-5 py-3">
                                        {a.parcelas_atraso > 0 ? (
                                            <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-red-100 text-red-600">
                                                {a.parcelas_atraso} em atraso
                                            </span>
                                        ) : (
                                            <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-emerald-100 text-emerald-700">Em dia</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
