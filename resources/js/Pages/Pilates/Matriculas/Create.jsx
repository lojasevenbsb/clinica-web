import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';

/* ─── helpers ────────────────────────────────────────────────────────────── */
const money = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const initials = (name) => (name ?? '').split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
const fmtDate = (d) => d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '';

const DAYS = [
    { label: 'Dom', value: 0 },
    { label: 'Seg', value: 1 },
    { label: 'Ter', value: 2 },
    { label: 'Qua', value: 3 },
    { label: 'Qui', value: 4 },
    { label: 'Sex', value: 5 },
    { label: 'Sáb', value: 6 },
];

/* ─── Stepper ────────────────────────────────────────────────────────────── */
function Stepper({ step }) {
    const steps = [
        { label: 'Aluno', icon: 'person' },
        { label: 'Contrato', icon: 'assignment' },
        { label: 'Agenda', icon: 'calendar_month' },
    ];
    return (
        <div className="flex items-center gap-1">
            {steps.map(({ label, icon }, i) => {
                const num = i + 1;
                const active = step === num;
                const done = step > num;
                return (
                    <div key={num} className="flex items-center">
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all ${active ? 'bg-[#466250] text-white' : done ? 'text-[#466250]' : 'text-stone-400'}`}>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${active ? 'bg-white/20' : done ? 'bg-[#466250]/10' : 'bg-stone-100'}`}>
                                {done
                                    ? <span className="material-symbols-outlined text-[#466250]" style={{ fontSize: 14 }}>check</span>
                                    : <span className={`text-xs font-bold ${active ? 'text-white' : 'text-stone-400'}`}>{num}</span>
                                }
                            </div>
                            <span className={`text-sm font-semibold hidden sm:block ${active ? 'text-white' : done ? 'text-[#466250]' : 'text-stone-400'}`}>{label}</span>
                        </div>
                        {i < steps.length - 1 && (
                            <div className={`w-8 h-px mx-1 transition-colors ${step > num ? 'bg-[#466250]' : 'bg-stone-200'}`} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

/* ─── Página principal ───────────────────────────────────────────────────── */
export default function MatriculaCreate({ pilatesPackages, patients, paymentOptions, nextNumber, preselectedPatientId, professionals }) {
    const [step, setStep] = useState(1);

    /* Patient */
    const [search, setSearch] = useState('');
    const [selectedPatient, setSelectedPatient] = useState(null);

    /* Form */
    const [data, setDataState] = useState({
        package_id: '',
        contract_number: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        price: '',
        payment_method_id: '',
        payment_type_id: '',
        status: 'active',
        notes: '',
        mensalidade_meses: '',
    });
    const setData = (key, value) => setDataState(prev => ({ ...prev, [key]: value }));

    /* Mensalidades */
    const [mensalidade, setMensalidade] = useState(false);
    const [parcelas, setParcelas] = useState([]);
    const [melhorData, setMelhorData] = useState(null);

    /* Submission */
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState({});

    /* Schedule (step 3) */
    const [savedEnrollment, setSavedEnrollment] = useState(null);
    const [scheduleSlots, setScheduleSlots] = useState({});
    const [scheduleProcessing, setScheduleProcessing] = useState(false);
    const [scheduleError, setScheduleError] = useState('');
    const [wantsSchedule, setWantsSchedule] = useState(null);
    const [scheduleProfessional, setScheduleProfessional] = useState('');

    const paymentMethods = paymentOptions.filter(o => o.group === 'method');
    const paymentTypes   = paymentOptions.filter(o => o.group === 'type');

    /* Pre-select patient from query param */
    useEffect(() => {
        if (preselectedPatientId) {
            const p = patients.find(x => x.id == preselectedPatientId);
            if (p) { setSelectedPatient(p); setStep(2); }
        }
    }, []);

    /* Auto-calc months from contract period */
    useEffect(() => {
        if (!data.start_date || !data.end_date) return;
        const s = new Date(data.start_date + 'T00:00:00'), e = new Date(data.end_date + 'T00:00:00');
        if (e <= s) return;
        const meses = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
        if (meses > 0) setData('mensalidade_meses', String(meses));
    }, [data.start_date, data.end_date]);

    /* Generate parcelas preview */
    useEffect(() => {
        if (!mensalidade) { setParcelas([]); return; }
        const numMeses = parseInt(data.mensalidade_meses), valor = parseFloat(data.price);
        const baseDate = data.start_date;
        if (!numMeses || numMeses < 1 || !valor || !baseDate) { setParcelas([]); return; }
        const start  = new Date(baseDate + 'T00:00:00');
        const dueDay = melhorData ?? start.getDate();
        const hoje   = new Date(); hoje.setHours(0, 0, 0, 0);
        setParcelas(Array.from({ length: numMeses }, (_, i) => {
            const venc = new Date(start.getFullYear(), start.getMonth() + i, dueDay);
            return {
                numero: i + 1,
                due_date: venc.toISOString().split('T')[0],
                data: venc.toLocaleDateString('pt-BR'),
                amount: valor,
                valor: valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
                paid: false,
                vencida: venc < hoje,
            };
        }));
    }, [mensalidade, data.mensalidade_meses, data.price, data.start_date, melhorData]);

    const filteredPatients = patients.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.cpf && p.cpf.includes(search))
    );

    const selectedPackage = pilatesPackages.find(p => p.id == data.package_id);
    const totalEstimado   = mensalidade && parcelas.length > 0
        ? parcelas.reduce((s, p) => s + p.amount, 0)
        : data.price ? parseFloat(data.price) : 0;

    /* Submit contract */
    const submit = async (e) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});
        try {
            const res = await axios.post(route('pilates.matriculas.store'), {
                ...data,
                patient_id:        selectedPatient.id,
                package_id:        data.package_id || null,
                payment_method_id: data.payment_method_id || null,
                payment_type_id:   data.payment_type_id   || null,
                installments: mensalidade && parcelas.length > 0
                    ? parcelas.map(p => ({ numero: p.numero, due_date: p.due_date, amount: p.amount, paid: p.paid }))
                    : [],
            });
            setSavedEnrollment(res.data);
            setStep(3);
        } catch (err) {
            if (err.response?.data?.errors) setErrors(err.response.data.errors);
        } finally {
            setProcessing(false);
        }
    };

    /* Schedule helpers */
    /* Calcula preview das datas geradas para cada dia selecionado */
    const buildDatePreview = (dayOfWeek, startDate, endDate) => {
        if (!startDate || !endDate) return [];
        const s = new Date(startDate + 'T00:00:00');
        const e = new Date(endDate   + 'T00:00:00');
        const dates = [];
        const cur = new Date(s);
        while (cur.getDay() !== dayOfWeek) cur.setDate(cur.getDate() + 1);
        while (cur <= e) {
            dates.push(new Date(cur));
            cur.setDate(cur.getDate() + 7);
        }
        return dates;
    };

    const toggleScheduleDay = (day) => {
        setScheduleSlots(prev => {
            if (prev[day]) { const next = { ...prev }; delete next[day]; return next; }
            return { ...prev, [day]: { time: '08:00', duration: 60, repeat: '' } };
        });
    };

    const [scheduleConflicts, setScheduleConflicts] = useState([]);

    const submitSchedule = async () => {
        const slots = Object.entries(scheduleSlots).map(([day, s]) => ({
            day_of_week: parseInt(day),
            start_time:  s.time,
            duration:    s.duration,
        }));
        if (slots.length === 0) { router.visit(route('pilates.matriculas.index')); return; }
        setScheduleProcessing(true);
        setScheduleError('');
        setScheduleConflicts([]);
        try {
            await axios.post(route('pilates.matriculas.schedule', savedEnrollment.id), {
                slots,
                professional_id: scheduleProfessional || undefined,
            });
            router.visit(route('pilates.matriculas.index'));
        } catch (err) {
            const data = err.response?.data ?? {};
            const conflicts = data.conflicts ?? [];
            setScheduleConflicts(conflicts);
            setScheduleError(data.message || Object.values(data.errors ?? {}).flat()[0] || 'Não foi possível gerar os agendamentos.');
        } finally {
            setScheduleProcessing(false);
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Nova Matrícula" />

            {/* ── Page header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.visit(route('pilates.matriculas.index'))}
                        className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div>
                        <p className="text-xs text-stone-400 font-medium">Matrículas / Nova Matrícula</p>
                        <h1 className="text-xl font-bold text-stone-800 leading-tight">
                            {step === 1 && 'Selecionar Aluno'}
                            {step === 2 && (selectedPatient ? selectedPatient.name : 'Dados do Contrato')}
                            {step === 3 && 'Agendamento de Treinos'}
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <Stepper step={step} />
                    <button
                        onClick={() => router.visit(route('pilates.matriculas.index'))}
                        className="text-sm text-stone-400 hover:text-stone-600 flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-stone-100 transition-colors"
                    >
                        <span className="material-symbols-outlined text-sm">close</span>
                        <span className="hidden sm:block">Cancelar</span>
                    </button>
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* STEP 1 — Selecionar aluno                                     */}
            {/* ══════════════════════════════════════════════════════════════ */}
            {step === 1 && (
                <div className="space-y-6">
                    {/* Search */}
                    <div className="relative max-w-xl">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-stone-400">search</span>
                        <input
                            autoFocus
                            type="text"
                            placeholder="Buscar por nome ou CPF..."
                            className="pl-12 pr-4 py-3.5 w-full border border-stone-200 rounded-2xl text-sm focus:ring-[#466250] focus:border-[#466250] outline-none bg-white shadow-sm"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>

                    {/* Selected patient banner */}
                    {selectedPatient && (
                        <div className="flex items-center gap-3 bg-[#466250]/5 border border-[#466250]/20 rounded-2xl px-5 py-3.5">
                            <div className="w-10 h-10 rounded-full bg-[#466250] flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                                {initials(selectedPatient.name)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-[#466250] text-sm">{selectedPatient.name} selecionado(a)</p>
                                <p className="text-xs text-stone-500">{selectedPatient.phone ?? selectedPatient.email ?? ''}</p>
                            </div>
                            <button type="button" onClick={() => setSelectedPatient(null)} className="text-stone-400 hover:text-stone-600 p-1 rounded-lg">
                                <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                        </div>
                    )}

                    {/* Patient list */}
                    <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
                        {/* list header */}
                        <div className="grid grid-cols-[auto_1fr_160px_160px] gap-4 px-4 py-2 bg-stone-50 border-b border-stone-100 text-xs font-semibold text-stone-400 uppercase tracking-wide">
                            <div className="w-9" />
                            <div>Nome</div>
                            <div>CPF</div>
                            <div>Telefone</div>
                        </div>

                        {filteredPatients.length === 0 ? (
                            <div className="text-center py-16 text-stone-400">
                                <span className="material-symbols-outlined text-5xl text-stone-300 block mb-3">person_search</span>
                                <p className="text-sm">Nenhum aluno encontrado.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-stone-100">
                                {filteredPatients.map(p => {
                                    const selected = selectedPatient?.id === p.id;
                                    return (
                                        <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => setSelectedPatient(selected ? null : p)}
                                            className={`w-full grid grid-cols-[auto_1fr_160px_160px] gap-4 items-center px-4 py-3 text-left transition-colors ${
                                                selected
                                                    ? 'bg-[#466250]/5'
                                                    : 'hover:bg-stone-50'
                                            }`}
                                        >
                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs transition-all ${
                                                selected ? 'bg-[#466250] text-white' : 'bg-stone-100 text-stone-500'
                                            }`}>
                                                {selected
                                                    ? <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check</span>
                                                    : initials(p.name)
                                                }
                                            </div>
                                            <div className={`font-semibold text-sm truncate ${selected ? 'text-[#466250]' : 'text-stone-800'}`}>
                                                {p.name}
                                            </div>
                                            <div className="text-xs text-stone-400 truncate">
                                                {p.cpf ?? '—'}
                                            </div>
                                            <div className="text-xs text-stone-400 truncate">
                                                {p.phone ?? '—'}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* counter footer */}
                        <div className="px-4 py-2 bg-stone-50 border-t border-stone-100 text-xs text-stone-400">
                            {filteredPatients.length} aluno{filteredPatients.length !== 1 ? 's' : ''} encontrado{filteredPatients.length !== 1 ? 's' : ''}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-stone-100">
                        <a
                            href={route('patients.create')}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-[#466250]/40 text-[#466250] text-sm font-medium hover:bg-[#466250]/5 transition-colors"
                        >
                            <span className="material-symbols-outlined text-base">person_add</span>
                            Cadastrar novo aluno
                        </a>
                        <button
                            type="button"
                            onClick={() => setStep(2)}
                            disabled={!selectedPatient}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
                                selectedPatient
                                    ? 'bg-[#466250] text-white hover:bg-[#384f40] shadow-lg shadow-[#466250]/20'
                                    : 'bg-stone-100 text-stone-400 cursor-not-allowed'
                            }`}
                        >
                            Próximo
                            <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </button>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* STEP 2 — Dados do contrato                                    */}
            {/* ══════════════════════════════════════════════════════════════ */}
            {step === 2 && (
                <form onSubmit={submit}>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* ── Main form (2/3) ── */}
                        <div className="lg:col-span-2 space-y-5">

                            {/* Identificação */}
                            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
                                <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-5">Identificação</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <InputLabel value="Nº da Matrícula" />
                                        <div className="mt-1 px-4 py-2.5 bg-[#466250]/5 border border-[#466250]/20 rounded-xl text-sm font-mono text-[#466250] font-bold tracking-wider">
                                            {nextNumber}
                                        </div>
                                        <p className="text-xs text-stone-400 mt-1">Gerado automaticamente</p>
                                    </div>
                                    <div>
                                        <InputLabel htmlFor="contract_number" value="Nº do Contrato" />
                                        <TextInput
                                            id="contract_number"
                                            className="mt-1 block w-full"
                                            value={data.contract_number}
                                            onChange={e => setData('contract_number', e.target.value)}
                                            placeholder="ex: CONT-2025-001"
                                        />
                                        <InputError message={errors.contract_number} className="mt-2" />
                                    </div>
                                </div>
                            </div>

                            {/* Plano */}
                            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
                                <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-5">Plano de Pilates</h3>

                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" style={{ fontSize: 20 }}>fitness_center</span>
                                    <select
                                        className="w-full pl-10 pr-10 py-2.5 border border-stone-200 rounded-xl text-sm text-stone-800 bg-white appearance-none focus:ring-[#466250] focus:border-[#466250] outline-none cursor-pointer"
                                        value={data.package_id}
                                        onChange={e => {
                                            const pkg = pilatesPackages.find(p => p.id == e.target.value);
                                            setDataState(prev => ({
                                                ...prev,
                                                package_id: e.target.value,
                                                price: pkg?.price != null ? pkg.price : prev.price,
                                            }));
                                        }}
                                    >
                                        <option value="">— Sem plano vinculado —</option>
                                        {pilatesPackages.map(pkg => (
                                            <option key={pkg.id} value={pkg.id}>{pkg.name}</option>
                                        ))}
                                    </select>
                                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" style={{ fontSize: 20 }}>expand_more</span>
                                </div>

                                {/* Preview do plano selecionado */}
                                {selectedPackage && (
                                    <div className="mt-3 flex items-center gap-4 px-4 py-3 bg-[#466250]/5 border border-[#466250]/20 rounded-xl">
                                        <span className="material-symbols-outlined text-[#466250]" style={{ fontSize: 22 }}>check_circle</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-[#466250]">{selectedPackage.name}</p>
                                            <div className="flex items-center gap-3 mt-0.5">
                                                {selectedPackage.price != null && (
                                                    <span className="text-xs text-stone-600 font-medium">{money(selectedPackage.price)}<span className="text-stone-400 font-normal">/mês</span></span>
                                                )}
                                                {selectedPackage.session_count && (
                                                    <span className="text-xs bg-[#466250]/10 text-[#466250] px-2 py-0.5 rounded-full">{selectedPackage.session_count} aulas/mês</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <InputError message={errors.package_id} className="mt-2" />
                            </div>

                            {/* Valor e Período */}
                            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
                                <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-5">Valor e Período</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <InputLabel htmlFor="price" value="Valor Mensal (R$)" />
                                        <TextInput
                                            id="price"
                                            type="number"
                                            step="0.01"
                                            className="mt-1 block w-full"
                                            value={data.price}
                                            onChange={e => setData('price', e.target.value)}
                                            required
                                            placeholder="0,00"
                                        />
                                        <InputError message={errors.price} className="mt-2" />
                                    </div>
                                    <div>
                                        <InputLabel htmlFor="start_date" value="Início do Contrato" />
                                        <TextInput
                                            id="start_date"
                                            type="date"
                                            className="mt-1 block w-full"
                                            value={data.start_date}
                                            onChange={e => setData('start_date', e.target.value)}
                                            required
                                        />
                                        <InputError message={errors.start_date} className="mt-2" />
                                    </div>
                                    <div>
                                        <InputLabel htmlFor="end_date" value="Término do Contrato" />
                                        <TextInput
                                            id="end_date"
                                            type="date"
                                            className="mt-1 block w-full"
                                            value={data.end_date}
                                            onChange={e => setData('end_date', e.target.value)}
                                            min={data.start_date || undefined}
                                        />
                                        <InputError message={errors.end_date} className="mt-2" />
                                    </div>
                                </div>
                            </div>

                            {/* Pagamento */}
                            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-5">
                                <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest">Pagamento</h3>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <InputLabel htmlFor="payment_method_id" value="Forma de Pagamento" />
                                        <select
                                            id="payment_method_id"
                                            className="mt-1 block w-full border-stone-200 focus:border-[#466250] focus:ring-[#466250] rounded-xl shadow-sm text-sm"
                                            value={data.payment_method_id}
                                            onChange={e => setData('payment_method_id', e.target.value)}
                                        >
                                            <option value="">Selecione</option>
                                            {paymentMethods.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <InputLabel htmlFor="payment_type_id" value="Tipo de Pagamento" />
                                        <select
                                            id="payment_type_id"
                                            className="mt-1 block w-full border-stone-200 focus:border-[#466250] focus:ring-[#466250] rounded-xl shadow-sm text-sm"
                                            value={data.payment_type_id}
                                            onChange={e => setData('payment_type_id', e.target.value)}
                                        >
                                            <option value="">Selecione</option>
                                            {paymentTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {/* Mensalidades toggle */}
                                <div
                                    onClick={() => setMensalidade(v => !v)}
                                    className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all select-none ${
                                        mensalidade ? 'border-[#466250] bg-[#466250]/5' : 'border-stone-200 hover:border-stone-300'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className={`material-symbols-outlined ${mensalidade ? 'text-[#466250]' : 'text-stone-400'}`}>payments</span>
                                        <div>
                                            <p className={`font-bold text-sm ${mensalidade ? 'text-[#466250]' : 'text-stone-700'}`}>Gerar Mensalidades</p>
                                            <p className="text-xs text-stone-400">Lançar parcelas com datas de vencimento</p>
                                        </div>
                                    </div>
                                    <div className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${mensalidade ? 'bg-[#466250]' : 'bg-stone-300'}`}>
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${mensalidade ? 'left-6' : 'left-1'}`} />
                                    </div>
                                </div>

                                {mensalidade && (
                                    <div className="space-y-3 p-4 bg-stone-50 rounded-xl border border-stone-100">
                                        {data.start_date && data.end_date && data.mensalidade_meses ? (
                                            <div className="flex items-center gap-2 text-xs text-stone-500">
                                                <span className="material-symbols-outlined text-[#466250]" style={{ fontSize: 16 }}>date_range</span>
                                                Período: {fmtDate(data.start_date)} → {fmtDate(data.end_date)}
                                                <span className="ml-1 font-semibold text-[#466250]">({data.mensalidade_meses} meses)</span>
                                            </div>
                                        ) : (
                                            <p className="text-xs text-amber-600 flex items-center gap-1.5">
                                                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>warning</span>
                                                Preencha o início e término do contrato para gerar as parcelas.
                                            </p>
                                        )}
                                        <div>
                                            <InputLabel htmlFor="melhor_dia" value="Melhor dia de vencimento" />
                                            <TextInput
                                                id="melhor_dia"
                                                type="number" min="1" max="31"
                                                className="mt-1 block w-full"
                                                placeholder="Dia (1–31) — padrão: dia do início"
                                                value={melhorData ?? ''}
                                                onChange={e => {
                                                    const v = parseInt(e.target.value);
                                                    setMelhorData(e.target.value === '' ? null : (v >= 1 && v <= 31 ? v : melhorData));
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Configurações */}
                            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-4">
                                <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest">Configurações</h3>
                                <div>
                                    <InputLabel htmlFor="status" value="Status da Matrícula" />
                                    <select
                                        id="status"
                                        className="mt-1 block w-full border-stone-200 focus:border-[#466250] focus:ring-[#466250] rounded-xl shadow-sm text-sm"
                                        value={data.status}
                                        onChange={e => setData('status', e.target.value)}
                                    >
                                        <option value="active">Ativo</option>
                                        <option value="inactive">Inativo</option>
                                        <option value="cancelled">Cancelado</option>
                                    </select>
                                </div>
                                <div>
                                    <InputLabel htmlFor="notes" value="Observações (Opcional)" />
                                    <textarea
                                        id="notes"
                                        className="mt-1 block w-full border border-stone-200 focus:border-[#466250] focus:ring-[#466250] rounded-xl shadow-sm text-sm p-3"
                                        value={data.notes}
                                        onChange={e => setData('notes', e.target.value)}
                                        rows="3"
                                        placeholder="Restrições, observações clínicas, preferências..."
                                    />
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-between items-center pb-8">
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-[#466250] transition-colors px-3 py-2 rounded-xl hover:bg-stone-50"
                                >
                                    <span className="material-symbols-outlined text-sm">arrow_back</span>
                                    Trocar aluno
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex items-center gap-2 px-8 py-3 bg-[#466250] text-white rounded-xl font-bold hover:bg-[#384f40] transition-all shadow-lg shadow-[#466250]/20 disabled:opacity-60"
                                >
                                    {processing ? (
                                        <><span className="material-symbols-outlined text-sm animate-spin">progress_activity</span> Salvando...</>
                                    ) : (
                                        <><span className="material-symbols-outlined text-sm">check</span> Confirmar Matrícula</>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* ── Resumo lateral (1/3) ── */}
                        <div className="space-y-4">
                            <div className="sticky top-8 space-y-4">

                                {/* Aluno */}
                                <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
                                    <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">Aluno</h3>
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-[#466250]/10 flex items-center justify-center flex-shrink-0 text-[#466250] font-bold">
                                            {initials(selectedPatient?.name ?? '')}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-bold text-stone-800 truncate">{selectedPatient?.name}</div>
                                            {selectedPatient?.phone && <div className="text-xs text-stone-400 mt-0.5">{selectedPatient.phone}</div>}
                                            {selectedPatient?.email && <div className="text-xs text-stone-400 truncate">{selectedPatient.email}</div>}
                                        </div>
                                    </div>
                                    <button type="button" onClick={() => setStep(1)} className="mt-3 text-xs text-[#466250] hover:underline">
                                        Trocar aluno
                                    </button>
                                </div>

                                {/* Plano selecionado */}
                                {selectedPackage && (
                                    <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
                                        <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">Plano</h3>
                                        <div className="font-bold text-stone-800">{selectedPackage.name}</div>
                                        {selectedPackage.session_count && (
                                            <div className="text-xs text-stone-400 mt-1">{selectedPackage.session_count} aulas/mês</div>
                                        )}
                                    </div>
                                )}

                                {/* Resumo financeiro */}
                                <div className="bg-[#466250]/5 rounded-2xl border border-[#466250]/15 p-5">
                                    <h3 className="text-xs font-bold text-[#466250]/60 uppercase tracking-widest mb-4">Resumo Financeiro</h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-stone-500">Valor mensal</span>
                                            <span className="font-bold text-stone-800">{data.price ? money(data.price) : '—'}</span>
                                        </div>
                                        {mensalidade && parcelas.length > 0 && (
                                            <>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-stone-500">Parcelas</span>
                                                    <span className="font-bold text-stone-800">{parcelas.length}×</span>
                                                </div>
                                                <div className="border-t border-[#466250]/15 pt-3 flex justify-between">
                                                    <span className="text-sm font-bold text-stone-700">Total estimado</span>
                                                    <span className="font-extrabold text-[#466250]">{money(totalEstimado)}</span>
                                                </div>
                                            </>
                                        )}
                                        {data.start_date && data.end_date && (
                                            <div className="text-xs text-stone-400 pt-1 border-t border-[#466250]/10 flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-stone-300" style={{ fontSize: 14 }}>date_range</span>
                                                {fmtDate(data.start_date)} → {fmtDate(data.end_date)}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Parcelas preview */}
                                {mensalidade && parcelas.length > 0 && (
                                    <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
                                        <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">
                                            {parcelas.length} Parcela{parcelas.length !== 1 ? 's' : ''}
                                        </h3>
                                        <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                                            {parcelas.map(p => (
                                                <div key={p.numero} className="flex items-center justify-between py-1.5 border-b border-stone-50 last:border-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-5 h-5 rounded-full bg-[#466250]/10 text-[#466250] flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                                                            {p.numero}
                                                        </span>
                                                        <span className="text-xs text-stone-600">{p.data}</span>
                                                    </div>
                                                    <span className={`text-xs font-bold ${p.vencida ? 'text-red-400' : 'text-[#466250]'}`}>
                                                        R$ {p.valor}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-xs text-stone-400 mt-3 text-right">
                                            Total: <span className="font-bold text-stone-600">{money(totalEstimado)}</span>
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </form>
            )}

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* STEP 3 — Agendamento                                          */}
            {/* ══════════════════════════════════════════════════════════════ */}
            {step === 3 && (
                <div className="max-w-2xl mx-auto space-y-6 pb-12">

                    {/* Success banner */}
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-center gap-4">
                        <div className="w-11 h-11 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                            <span className="material-symbols-outlined text-emerald-600" style={{ fontSize: 24 }}>check_circle</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-emerald-800">Matrícula criada com sucesso!</p>
                            <p className="text-sm text-emerald-600 mt-0.5">
                                <span className="font-mono font-bold">{savedEnrollment?.enrollment_number}</span>
                                <span className="mx-2 opacity-50">·</span>
                                <span>{selectedPatient?.name}</span>
                            </p>
                        </div>
                    </div>

                    {/* Card do plano */}
                    {savedEnrollment?.package?.name && (
                        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 flex items-center gap-4">
                            <div className="w-11 h-11 rounded-xl bg-[#466250]/10 flex items-center justify-center flex-shrink-0">
                                <span className="material-symbols-outlined text-[#466250]">fitness_center</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-0.5">Plano contratado</p>
                                <p className="font-bold text-stone-800">{savedEnrollment.package.name}</p>
                            </div>
                            {savedEnrollment?.price && (
                                <div className="text-right flex-shrink-0">
                                    <p className="font-bold text-[#466250]">{money(savedEnrollment.price)}</p>
                                    <p className="text-xs text-stone-400">por mês</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Pergunta: quer agendar agora? */}
                    {wantsSchedule === null && (
                        <div className="bg-white rounded-2xl border-2 border-[#466250]/20 shadow-sm p-6 space-y-5">
                            <div className="flex items-start gap-4">
                                <div className="w-11 h-11 rounded-xl bg-[#466250]/10 flex items-center justify-center flex-shrink-0">
                                    <span className="material-symbols-outlined text-[#466250]">calendar_month</span>
                                </div>
                                <div>
                                    <h2 className="font-bold text-stone-800 text-base">Deseja agendar os treinos agora?</h2>
                                    <p className="text-sm text-stone-500 mt-1">
                                        Defina os dias e horários que <strong>{selectedPatient?.name}</strong> vai treinar e os agendamentos serão gerados automaticamente para todo o período do contrato.
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setWantsSchedule(true)}
                                    className="flex items-center justify-center gap-2 py-3 bg-[#466250] text-white rounded-xl font-bold hover:bg-[#384f40] transition-all shadow-md shadow-[#466250]/20"
                                >
                                    <span className="material-symbols-outlined text-sm">calendar_add_on</span>
                                    Sim, agendar agora
                                </button>
                                <button
                                    type="button"
                                    onClick={() => router.visit(route('pilates.matriculas.index'))}
                                    className="flex items-center justify-center gap-2 py-3 border border-stone-200 text-stone-600 rounded-xl font-semibold hover:bg-stone-50 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-sm">schedule</span>
                                    Não, fazer depois
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Formulário de agendamento */}
                    {wantsSchedule === true && (
                        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-6">
                            <div>
                                <h2 className="font-bold text-stone-800 text-base">Escolha os dias e horários</h2>
                                <p className="text-sm text-stone-500 mt-1">
                                    Selecione os dias da semana e configure o horário de cada treino.
                                    {savedEnrollment?.start_date && savedEnrollment?.end_date && (
                                        <span className="block mt-1 text-xs text-stone-400">
                                            Os agendamentos serão gerados de <strong>{fmtDate(savedEnrollment.start_date)}</strong> até <strong>{fmtDate(savedEnrollment.end_date)}</strong>.
                                        </span>
                                    )}
                                </p>
                            </div>

                            {scheduleError && (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
                                    <div className="flex items-start gap-2 text-sm text-red-700 font-semibold">
                                        <span className="material-symbols-outlined text-red-500 flex-shrink-0" style={{ fontSize: 20 }}>event_busy</span>
                                        <span>Horários indisponíveis — verifique os conflitos abaixo e escolha outro profissional ou ajuste os horários.</span>
                                    </div>
                                    {scheduleConflicts.length > 0 && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                                            {scheduleConflicts.map((c, i) => (
                                                <div key={i} className="flex items-center gap-2 bg-white border border-red-100 rounded-lg px-3 py-2 text-xs">
                                                    <span className="material-symbols-outlined text-red-400" style={{ fontSize: 14 }}>block</span>
                                                    <div>
                                                        <p className="font-semibold text-red-700">{c.data}</p>
                                                        <p className="text-red-500">{c.inicio} – {c.fim}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Profissional */}
                            {professionals?.length > 0 && (
                                <div>
                                    <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Profissional</p>
                                    <div className="relative">
                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" style={{ fontSize: 18 }}>person</span>
                                        <select
                                            className="w-full pl-9 pr-9 py-2.5 border border-stone-200 rounded-xl text-sm bg-white appearance-none focus:ring-[#466250] focus:border-[#466250] outline-none cursor-pointer"
                                            value={scheduleProfessional}
                                            onChange={e => setScheduleProfessional(e.target.value)}
                                        >
                                            <option value="">— Selecionar automaticamente —</option>
                                            {professionals.map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" style={{ fontSize: 18 }}>expand_more</span>
                                    </div>
                                </div>
                            )}

                            {/* Seleção de dias */}
                            <div>
                                <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">
                                    Dias da semana
                                    {Object.keys(scheduleSlots).length > 0 && (
                                        <span className="ml-2 normal-case font-normal text-[#466250]">
                                            — {Object.keys(scheduleSlots).length} dia{Object.keys(scheduleSlots).length > 1 ? 's' : ''} selecionado{Object.keys(scheduleSlots).length > 1 ? 's' : ''}
                                        </span>
                                    )}
                                </p>
                                <div className="grid grid-cols-7 gap-2">
                                    {DAYS.map(d => {
                                        const active = !!scheduleSlots[d.value];
                                        return (
                                            <button
                                                key={d.value}
                                                type="button"
                                                onClick={() => toggleScheduleDay(d.value)}
                                                className={`py-3 rounded-xl text-sm font-bold transition-all border-2 ${
                                                    active
                                                        ? 'bg-[#466250] text-white border-[#466250] shadow-md shadow-[#466250]/20'
                                                        : 'bg-white text-stone-500 border-stone-200 hover:border-[#466250]/40 hover:text-[#466250]'
                                                }`}
                                            >
                                                {d.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Horários por dia */}
                            {Object.keys(scheduleSlots).length > 0 && (
                                <div className="space-y-3">
                                    <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">Horários</p>
                                    {DAYS.filter(d => scheduleSlots[d.value]).map(d => (
                                        <div key={d.value} className="flex items-center gap-4 p-4 bg-stone-50 rounded-xl border border-stone-100">
                                            <div className="w-12 h-12 rounded-xl bg-[#466250] flex items-center justify-center flex-shrink-0">
                                                <span className="text-white text-sm font-bold">{d.label}</span>
                                            </div>
                                            <div className="flex items-center gap-4 flex-1 flex-wrap">
                                                <div className="flex items-center gap-2">
                                                    <label className="text-xs text-stone-500 font-medium whitespace-nowrap">Início</label>
                                                    <input
                                                        type="time"
                                                        value={scheduleSlots[d.value].time}
                                                        onChange={e => setScheduleSlots(prev => ({ ...prev, [d.value]: { ...prev[d.value], time: e.target.value } }))}
                                                        className="border border-stone-200 rounded-lg px-3 py-1.5 text-sm focus:ring-[#466250] focus:border-[#466250] outline-none"
                                                    />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <label className="text-xs text-stone-500 font-medium whitespace-nowrap">Duração</label>
                                                    <select
                                                        value={scheduleSlots[d.value].duration}
                                                        onChange={e => setScheduleSlots(prev => ({ ...prev, [d.value]: { ...prev[d.value], duration: parseInt(e.target.value) } }))}
                                                        className="border border-stone-200 rounded-lg px-3 py-1.5 text-sm focus:ring-[#466250] focus:border-[#466250] outline-none"
                                                    >
                                                        <option value={30}>30 min</option>
                                                        <option value={45}>45 min</option>
                                                        <option value={60}>1 hora</option>
                                                        <option value={90}>1h30</option>
                                                        <option value={120}>2 horas</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => toggleScheduleDay(d.value)}
                                                className="p-1.5 text-stone-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                                            >
                                                <span className="material-symbols-outlined text-base">close</span>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Preview de datas */}
                            {Object.keys(scheduleSlots).length > 0 && savedEnrollment?.start_date && savedEnrollment?.end_date && (() => {
                                const allDates = DAYS
                                    .filter(d => scheduleSlots[d.value])
                                    .flatMap(d => buildDatePreview(d.value, savedEnrollment.start_date, savedEnrollment.end_date)
                                        .map(dt => ({ day: d.label, date: dt, time: scheduleSlots[d.value].time }))
                                    )
                                    .sort((a, b) => a.date - b.date);

                                if (allDates.length === 0) return null;

                                return (
                                    <div className="bg-stone-50 rounded-xl border border-stone-100 p-4">
                                        <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3">
                                            {allDates.length} agendamento{allDates.length !== 1 ? 's' : ''} a serem criados
                                        </p>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                            {allDates.map((item, i) => (
                                                <div key={i} className="flex items-center gap-2 bg-white border border-stone-100 rounded-lg px-3 py-2">
                                                    <span className="w-7 h-7 rounded-lg bg-[#466250] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                                                        {item.day}
                                                    </span>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-semibold text-stone-700">
                                                            {item.date.toLocaleDateString('pt-BR')}
                                                        </p>
                                                        <p className="text-[10px] text-stone-400">{item.time}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Footer do formulário */}
                            <div className="flex justify-between gap-3 pt-2 border-t border-stone-100">
                                <button
                                    type="button"
                                    onClick={() => { setWantsSchedule(null); setScheduleSlots({}); setScheduleError(''); }}
                                    className="text-sm text-stone-500 hover:text-stone-700 flex items-center gap-1 px-3 py-2 rounded-xl hover:bg-stone-50 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-sm">arrow_back</span>
                                    Voltar
                                </button>
                                <button
                                    type="button"
                                    disabled={scheduleProcessing || Object.keys(scheduleSlots).length === 0}
                                    onClick={submitSchedule}
                                    className="flex items-center gap-2 px-8 py-2.5 bg-[#466250] text-white rounded-xl font-bold hover:bg-[#384f40] transition-all shadow-lg shadow-[#466250]/20 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {scheduleProcessing ? (
                                        <><span className="material-symbols-outlined text-sm animate-spin">progress_activity</span> Agendando...</>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined text-sm">calendar_add_on</span>
                                            Confirmar Agendamento{Object.keys(scheduleSlots).length > 0 ? ` (${Object.keys(scheduleSlots).length} dia${Object.keys(scheduleSlots).length > 1 ? 's' : ''})` : ''}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </AuthenticatedLayout>
    );
}
