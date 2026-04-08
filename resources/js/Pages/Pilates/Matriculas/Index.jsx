import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import DangerButton from '@/Components/DangerButton';

/* ─── helpers ──────────────────────────────────────────────────────────── */
const fmt    = (d) => d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '—';
const money  = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const STATUS = {
    active:    { label: 'Ativo',     cls: 'bg-emerald-100 text-emerald-700' },
    inactive:  { label: 'Inativo',   cls: 'bg-stone-100 text-stone-500' },
    cancelled: { label: 'Cancelado', cls: 'bg-red-100 text-red-600' },
};

/* ─── Modal Nova Matrícula ─────────────────────────────────────────────── */
function EnrollmentModal({ show, onClose, pilatesPackages, patients, paymentOptions, nextNumber, onSaved }) {
    const [step, setStep]                   = useState('select'); // 'select' | 'form'
    const [search, setSearch]               = useState('');
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [mensalidade, setMensalidade]     = useState(false);
    const [parcelas, setParcelas]           = useState([]);
    const [melhorData, setMelhorData]       = useState(null);
    const [instStartDate, setInstStartDate] = useState('');
    const [instEndDate, setInstEndDate]     = useState('');
    const [processing, setProcessing]       = useState(false);
    const [errors, setErrors]               = useState({});

    const paymentMethods = paymentOptions.filter(o => o.group === 'method');
    const paymentTypes   = paymentOptions.filter(o => o.group === 'type');

    const [data, setDataState] = useState({
        package_id: '', contract_number: '', start_date: new Date().toISOString().split('T')[0],
        end_date: '', price: '', sessions_per_month: '', payment_method_id: '',
        payment_type_id: '', status: 'active', notes: '', mensalidade_meses: '',
    });

    const setData = (key, value) => setDataState(prev => ({ ...prev, [key]: value }));

    const reset = () => {
        setDataState({ package_id: '', contract_number: '', start_date: new Date().toISOString().split('T')[0], end_date: '', price: '', sessions_per_month: '', payment_method_id: '', payment_type_id: '', status: 'active', notes: '', mensalidade_meses: '' });
        setInstStartDate(''); setInstEndDate(''); setErrors({});
        setMensalidade(false); setParcelas([]); setMelhorData(null);
        setSelectedPatient(null); setSearch(''); setStep('select');
    };

    const handleClose = () => { reset(); onClose(); };

    // auto-calcula meses pelas datas de início/fim das parcelas
    useEffect(() => {
        if (!instStartDate || !instEndDate) return;
        const s = new Date(instStartDate + 'T00:00:00'), e = new Date(instEndDate + 'T00:00:00');
        if (e <= s) return;
        const meses = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
        if (meses > 0) setData('mensalidade_meses', String(meses));
    }, [instStartDate, instEndDate]);

    useEffect(() => {
        if (!instStartDate && data.start_date) setInstStartDate(data.start_date);
    }, [data.start_date]);

    // gera parcelas preview
    useEffect(() => {
        if (!mensalidade) { setParcelas([]); return; }
        const numMeses = parseInt(data.mensalidade_meses), valor = parseFloat(data.price);
        const baseDate = instStartDate || data.start_date;
        if (!numMeses || numMeses < 1 || !valor || !baseDate) { setParcelas([]); return; }
        const start  = new Date(baseDate + 'T00:00:00');
        const dueDay = melhorData ?? start.getDate();
        const hoje   = new Date(); hoje.setHours(0, 0, 0, 0);
        setParcelas(Array.from({ length: numMeses }, (_, i) => {
            const venc = new Date(start.getFullYear(), start.getMonth() + i, dueDay);
            return { numero: i + 1, due_date: venc.toISOString().split('T')[0], data: venc.toLocaleDateString('pt-BR'), amount: valor, valor: valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 }), paid: false, pago: false, vencida: venc < hoje };
        }));
    }, [mensalidade, data.mensalidade_meses, data.price, data.start_date, instStartDate, melhorData]);

    const filteredPatients = patients.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) || (p.cpf && p.cpf.includes(search))
    );

    const submit = async (e) => {
        e.preventDefault(); setProcessing(true); setErrors({});
        try {
            const res = await axios.post(route('pilates.matriculas.store'), {
                ...data,
                patient_id:   selectedPatient.id,
                package_id:   data.package_id || null,
                payment_method_id: data.payment_method_id || null,
                payment_type_id:   data.payment_type_id   || null,
                installments: mensalidade && parcelas.length > 0
                    ? parcelas.map(p => ({ numero: p.numero, due_date: p.due_date, amount: p.amount, paid: p.paid }))
                    : [],
            });
            onSaved(res.data);
            reset(); onClose();
        } catch (err) {
            if (err.response?.data?.errors) setErrors(err.response.data.errors);
        } finally { setProcessing(false); }
    };

    return (
        <Modal show={show} onClose={handleClose} maxWidth="lg">
            <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-[#466250]">Nova Matrícula</h2>
                        <p className="text-stone-500 text-sm">
                            {step === 'select'
                                ? 'Selecione o aluno no cadastro'
                                : <><span className="font-bold text-stone-800">{selectedPatient?.name}</span> · <span className="font-mono text-[#466250] text-xs">{nextNumber}</span></>
                            }
                        </p>
                    </div>
                    <button onClick={handleClose} className="p-2 text-stone-400 hover:text-stone-600 transition-colors"><span className="material-symbols-outlined">close</span></button>
                </div>

                {/* Step 1 — Selecionar aluno */}
                {step === 'select' && (
                    <div className="space-y-3">
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">search</span>
                            <input autoFocus type="text" placeholder="Buscar por nome ou CPF..." className="pl-10 pr-4 py-2.5 w-full border border-stone-200 rounded-xl text-sm focus:ring-[#466250] focus:border-[#466250] outline-none" value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                        <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
                            {filteredPatients.length === 0 ? (
                                <div className="text-center py-8 text-stone-400">
                                    <span className="material-symbols-outlined text-3xl text-stone-300">person_search</span>
                                    <p className="text-sm mt-2">Nenhuma pessoa encontrada.</p>
                                    <a href={route('patients.create')} className="text-xs text-[#466250] underline mt-1 block">Criar novo cadastro</a>
                                </div>
                            ) : filteredPatients.map(p => (
                                <button key={p.id} type="button" onClick={() => { setSelectedPatient(p); setStep('form'); }}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#466250]/5 border border-transparent hover:border-[#466250]/20 transition-all text-left">
                                    <div className="w-9 h-9 rounded-full bg-[#466250]/10 flex items-center justify-center flex-shrink-0">
                                        <span className="material-symbols-outlined text-[#466250] text-lg">person</span>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="font-semibold text-stone-800 text-sm">{p.name}</div>
                                        <div className="text-xs text-stone-400">{p.cpf && <span className="mr-3">{p.cpf}</span>}{p.phone && <span>{p.phone}</span>}</div>
                                    </div>
                                    <span className="material-symbols-outlined text-stone-300">chevron_right</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 2 — Formulário da matrícula */}
                {step === 'form' && (
                    <form onSubmit={submit} className="space-y-5">
                        <button type="button" onClick={() => setStep('select')} className="flex items-center gap-1 text-sm text-stone-500 hover:text-[#466250] transition-colors">
                            <span className="material-symbols-outlined text-sm">arrow_back</span> Trocar aluno
                        </button>

                        {/* Número da matrícula + Número do contrato */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <InputLabel value="Nº da Matrícula" />
                                <div className="mt-1 px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-mono text-[#466250] font-bold tracking-wider">{nextNumber}</div>
                                <p className="text-xs text-stone-400 mt-1">Gerado automaticamente</p>
                            </div>
                            <div>
                                <InputLabel htmlFor="contract_number" value="Nº do Contrato" />
                                <TextInput id="contract_number" className="mt-1 block w-full" value={data.contract_number} onChange={e => setData('contract_number', e.target.value)} placeholder="ex: CONT-2026-001" />
                                <InputError message={errors.contract_number} className="mt-2" />
                            </div>
                        </div>

                        {/* Plano */}
                        <div>
                            <InputLabel htmlFor="package_id" value="Plano de Pilates" />
                            <select id="package_id" className="mt-1 block w-full border-stone-200 focus:border-[#466250] focus:ring-[#466250] rounded-xl shadow-sm"
                                value={data.package_id} onChange={e => { const pkg = pilatesPackages.find(p => p.id == e.target.value); setDataState(prev => ({ ...prev, package_id: e.target.value, price: pkg?.price ?? prev.price })); }}>
                                <option value="">Selecione (opcional)</option>
                                {pilatesPackages.map(p => <option key={p.id} value={p.id}>{p.name}{p.price ? ` — ${money(p.price)}` : ''}</option>)}
                            </select>
                            <InputError message={errors.package_id} className="mt-2" />
                        </div>

                        {/* Datas de início e término do contrato */}
                        <fieldset className="border border-stone-100 rounded-xl p-4 space-y-3">
                            <legend className="text-xs font-bold text-stone-400 uppercase tracking-wider px-1">Período do Contrato</legend>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <InputLabel htmlFor="start_date" value="Início" />
                                    <TextInput id="start_date" type="date" className="mt-1 block w-full" value={data.start_date} onChange={e => setData('start_date', e.target.value)} required />
                                    <InputError message={errors.start_date} className="mt-2" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="end_date" value="Término" />
                                    <TextInput id="end_date" type="date" className="mt-1 block w-full" value={data.end_date} onChange={e => setData('end_date', e.target.value)} min={data.start_date || undefined} />
                                    <InputError message={errors.end_date} className="mt-2" />
                                </div>
                            </div>
                        </fieldset>

                        {/* Valor + Aulas/mês */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <InputLabel htmlFor="price" value="Valor Mensal (R$)" />
                                <TextInput id="price" type="number" step="0.01" className="mt-1 block w-full" value={data.price} onChange={e => setData('price', e.target.value)} required />
                                <InputError message={errors.price} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="sessions_per_month" value="Aulas por Mês" />
                                <TextInput id="sessions_per_month" type="number" min="1" className="mt-1 block w-full" value={data.sessions_per_month} onChange={e => setData('sessions_per_month', e.target.value)} placeholder="ex: 12" />
                            </div>
                        </div>

                        {/* Pagamento */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <InputLabel htmlFor="payment_method_id" value="Forma de Pagamento" />
                                <select id="payment_method_id" className="mt-1 block w-full border-stone-200 focus:border-[#466250] focus:ring-[#466250] rounded-xl shadow-sm" value={data.payment_method_id} onChange={e => setData('payment_method_id', e.target.value)}>
                                    <option value="">Selecione</option>
                                    {paymentMethods.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <InputLabel htmlFor="payment_type_id" value="Tipo de Pagamento" />
                                <select id="payment_type_id" className="mt-1 block w-full border-stone-200 focus:border-[#466250] focus:ring-[#466250] rounded-xl shadow-sm" value={data.payment_type_id} onChange={e => setData('payment_type_id', e.target.value)}>
                                    <option value="">Selecione</option>
                                    {paymentTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Status */}
                        <div>
                            <InputLabel htmlFor="status" value="Status" />
                            <select id="status" className="mt-1 block w-full border-stone-200 focus:border-[#466250] focus:ring-[#466250] rounded-xl shadow-sm" value={data.status} onChange={e => setData('status', e.target.value)}>
                                <option value="active">Ativo</option>
                                <option value="inactive">Inativo</option>
                                <option value="cancelled">Cancelado</option>
                            </select>
                        </div>

                        {/* Toggle Mensalidades */}
                        <div onClick={() => setMensalidade(!mensalidade)}
                            className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all select-none ${mensalidade ? 'border-[#466250] bg-[#466250]/5' : 'border-stone-200 hover:border-stone-300'}`}>
                            <div className="flex items-center gap-3">
                                <span className={`material-symbols-outlined text-xl ${mensalidade ? 'text-[#466250]' : 'text-stone-400'}`}>payments</span>
                                <div>
                                    <p className={`font-bold text-sm ${mensalidade ? 'text-[#466250]' : 'text-stone-700'}`}>Gerar Mensalidades</p>
                                    <p className="text-xs text-stone-400">Lançar parcelas com datas de vencimento</p>
                                </div>
                            </div>
                            <div className={`w-11 h-6 rounded-full transition-colors relative ${mensalidade ? 'bg-[#466250]' : 'bg-stone-300'}`}>
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${mensalidade ? 'left-6' : 'left-1'}`} />
                            </div>
                        </div>

                        {mensalidade && (
                            <div className="space-y-4 p-4 bg-stone-50 rounded-xl border border-stone-100">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <InputLabel htmlFor="inst_start" value="Início das Parcelas" />
                                        <TextInput id="inst_start" type="date" className="mt-1 block w-full" value={instStartDate} onChange={e => setInstStartDate(e.target.value)} />
                                    </div>
                                    <div>
                                        <InputLabel htmlFor="inst_end" value="Término das Parcelas" />
                                        <TextInput id="inst_end" type="date" className="mt-1 block w-full" value={instEndDate} onChange={e => setInstEndDate(e.target.value)} min={instStartDate || undefined} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <InputLabel htmlFor="meses" value="Qtd. Meses" />
                                        <TextInput id="meses" type="number" min="1" className="mt-1 block w-full" value={data.mensalidade_meses} onChange={e => { setData('mensalidade_meses', e.target.value); setInstEndDate(''); }} placeholder="ex: 6" />
                                    </div>
                                    <div>
                                        <InputLabel htmlFor="melhor_dia" value="Melhor dia de pgto." />
                                        <TextInput id="melhor_dia" type="number" min="1" max="31" className="mt-1 block w-full" placeholder="Dia (1–31)" value={melhorData ?? ''} onChange={e => { const v = parseInt(e.target.value); setMelhorData(e.target.value === '' ? null : (v >= 1 && v <= 31 ? v : melhorData)); }} />
                                    </div>
                                </div>
                                {parcelas.length > 0 && (
                                    <div>
                                        <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">{parcelas.length} parcela{parcelas.length > 1 ? 's' : ''} gerada{parcelas.length > 1 ? 's' : ''}</p>
                                        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                                            {parcelas.map(p => (
                                                <div key={p.numero} className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-stone-100 text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-5 h-5 rounded-full bg-[#466250]/10 text-[#466250] flex items-center justify-center text-[10px] font-bold">{p.numero}</span>
                                                        <span className="text-stone-600">{p.data}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-bold text-[#466250]">R$ {p.valor}</span>
                                                        <button type="button" onClick={() => setParcelas(prev => prev.map(x => x.numero === p.numero ? { ...x, pago: !x.pago, paid: !x.paid } : x))}
                                                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${p.pago ? 'bg-emerald-100 text-emerald-700' : p.vencida ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                                                            {p.pago ? 'Pago' : p.vencida ? 'Vencida' : 'Pendente'}
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-xs text-stone-400 mt-2 text-right">Total: <span className="font-bold text-stone-600">R$ {(parseFloat(data.price) * parcelas.length).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Observações */}
                        <div>
                            <InputLabel htmlFor="notes" value="Observações (Opcional)" />
                            <textarea id="notes" className="mt-1 block w-full border-stone-200 focus:border-[#466250] focus:ring-[#466250] rounded-xl shadow-sm text-sm" value={data.notes} onChange={e => setData('notes', e.target.value)} rows="2" />
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <SecondaryButton type="button" onClick={handleClose}>Cancelar</SecondaryButton>
                            <PrimaryButton disabled={processing}>{processing ? 'Salvando...' : 'Confirmar Matrícula'}</PrimaryButton>
                        </div>
                    </form>
                )}
            </div>
        </Modal>
    );
}

/* ─── Modal Editar Matrícula ───────────────────────────────────────────── */
function EditEnrollmentModal({ show, onClose, enrollment, paymentOptions, onSaved }) {
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors]         = useState({});
    const [data, setDataState]        = useState(null);

    const paymentMethods = paymentOptions.filter(o => o.group === 'method');
    const paymentTypes   = paymentOptions.filter(o => o.group === 'type');

    useEffect(() => {
        if (enrollment) {
            setDataState({
                contract_number:    enrollment.contract_number   ?? '',
                start_date:         enrollment.start_date        ?? '',
                end_date:           enrollment.end_date          ?? '',
                price:              enrollment.price             ?? '',
                sessions_per_month: enrollment.sessions_per_month ?? '',
                payment_method_id:  '',
                payment_type_id:    '',
                status:             enrollment.status,
                notes:              enrollment.notes ?? '',
            });
        }
    }, [enrollment]);

    const setData = (key, value) => setDataState(prev => ({ ...prev, [key]: value }));

    const submit = async (e) => {
        e.preventDefault(); setProcessing(true); setErrors({});
        try {
            const res = await axios.put(route('pilates.matriculas.update', enrollment.id), { ...data, payment_method_id: data.payment_method_id || null, payment_type_id: data.payment_type_id || null });
            onSaved(res.data);
            onClose();
        } catch (err) {
            if (err.response?.data?.errors) setErrors(err.response.data.errors);
        } finally { setProcessing(false); }
    };

    if (!data) return null;

    return (
        <Modal show={show} onClose={onClose} maxWidth="lg">
            <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-[#466250]">Editar Matrícula</h2>
                        <p className="text-stone-500 text-sm"><span className="font-mono text-[#466250]">{enrollment?.enrollment_number}</span> · {enrollment?.patient?.name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-600"><span className="material-symbols-outlined">close</span></button>
                </div>
                <form onSubmit={submit} className="space-y-5">
                    {/* Contrato */}
                    <div>
                        <InputLabel htmlFor="edit_contract" value="Nº do Contrato" />
                        <TextInput id="edit_contract" className="mt-1 block w-full" value={data.contract_number} onChange={e => setData('contract_number', e.target.value)} placeholder="ex: CONT-2026-001" />
                        <InputError message={errors.contract_number} className="mt-2" />
                    </div>
                    {/* Datas */}
                    <fieldset className="border border-stone-100 rounded-xl p-4 space-y-3">
                        <legend className="text-xs font-bold text-stone-400 uppercase tracking-wider px-1">Período do Contrato</legend>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <InputLabel htmlFor="edit_start" value="Início" />
                                <TextInput id="edit_start" type="date" className="mt-1 block w-full" value={data.start_date} onChange={e => setData('start_date', e.target.value)} required />
                                <InputError message={errors.start_date} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="edit_end" value="Término" />
                                <TextInput id="edit_end" type="date" className="mt-1 block w-full" value={data.end_date} onChange={e => setData('end_date', e.target.value)} min={data.start_date || undefined} />
                                <InputError message={errors.end_date} className="mt-2" />
                            </div>
                        </div>
                    </fieldset>
                    {/* Valor + Aulas */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <InputLabel htmlFor="edit_price" value="Valor Mensal (R$)" />
                            <TextInput id="edit_price" type="number" step="0.01" className="mt-1 block w-full" value={data.price} onChange={e => setData('price', e.target.value)} required />
                            <InputError message={errors.price} className="mt-2" />
                        </div>
                        <div>
                            <InputLabel htmlFor="edit_sessions" value="Aulas por Mês" />
                            <TextInput id="edit_sessions" type="number" min="1" className="mt-1 block w-full" value={data.sessions_per_month} onChange={e => setData('sessions_per_month', e.target.value)} />
                        </div>
                    </div>
                    {/* Pagamento */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <InputLabel value="Forma de Pagamento" />
                            <select className="mt-1 block w-full border-stone-200 focus:border-[#466250] focus:ring-[#466250] rounded-xl shadow-sm" value={data.payment_method_id} onChange={e => setData('payment_method_id', e.target.value)}>
                                <option value="">Selecione</option>
                                {paymentMethods.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <InputLabel value="Tipo de Pagamento" />
                            <select className="mt-1 block w-full border-stone-200 focus:border-[#466250] focus:ring-[#466250] rounded-xl shadow-sm" value={data.payment_type_id} onChange={e => setData('payment_type_id', e.target.value)}>
                                <option value="">Selecione</option>
                                {paymentTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                    </div>
                    {/* Status */}
                    <div>
                        <InputLabel htmlFor="edit_status" value="Status" />
                        <select id="edit_status" className="mt-1 block w-full border-stone-200 focus:border-[#466250] focus:ring-[#466250] rounded-xl shadow-sm" value={data.status} onChange={e => setData('status', e.target.value)}>
                            <option value="active">Ativo</option>
                            <option value="inactive">Inativo</option>
                            <option value="cancelled">Cancelado</option>
                        </select>
                    </div>
                    {/* Notas */}
                    <div>
                        <InputLabel value="Observações" />
                        <textarea className="mt-1 block w-full border-stone-200 focus:border-[#466250] focus:ring-[#466250] rounded-xl shadow-sm text-sm" value={data.notes} onChange={e => setData('notes', e.target.value)} rows="2" />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <SecondaryButton type="button" onClick={onClose}>Cancelar</SecondaryButton>
                        <PrimaryButton disabled={processing}>{processing ? 'Salvando...' : 'Salvar Alterações'}</PrimaryButton>
                    </div>
                </form>
            </div>
        </Modal>
    );
}

/* ─── Linha expandível da tabela ───────────────────────────────────────── */
function EnrollmentRow({ enrollment, paymentOptions, onEdit, onDelete }) {
    const [open, setOpen]           = useState(false);
    const [installments, setInstallments] = useState(enrollment.installments);
    const [toggling, setToggling]   = useState(null);

    useEffect(() => setInstallments(enrollment.installments), [enrollment.installments]);

    const togglePaid = (inst) => {
        setToggling(inst.id);
        axios.patch(route('pilates.matriculas.installments.toggle', inst.id))
            .then(res => setInstallments(prev => prev.map(i => i.id === inst.id ? { ...i, paid: res.data.paid, paid_at: res.data.paid_at } : i)))
            .finally(() => setToggling(null));
    };

    const st     = STATUS[enrollment.status] ?? { label: enrollment.status, cls: 'bg-stone-100 text-stone-500' };
    const paid   = installments.filter(i => i.paid).length;
    const pending = installments.filter(i => !i.paid).length;

    return (
        <>
            <tr className="hover:bg-stone-50/60 transition-colors cursor-pointer" onClick={() => setOpen(o => !o)}>
                {/* Nº Matrícula */}
                <td className="px-5 py-4">
                    <span className="font-mono text-xs font-bold text-[#466250] bg-[#466250]/8 px-2 py-1 rounded-lg">{enrollment.enrollment_number}</span>
                    {enrollment.contract_number && <div className="text-[10px] text-stone-400 mt-1">Contrato: {enrollment.contract_number}</div>}
                </td>
                {/* Aluno */}
                <td className="px-5 py-4">
                    <div className="font-bold text-stone-800 text-sm">{enrollment.patient?.name}</div>
                    {enrollment.patient?.phone && <div className="text-xs text-stone-400">{enrollment.patient.phone}</div>}
                </td>
                {/* Plano */}
                <td className="px-5 py-4">
                    <div className="text-sm text-stone-700">{enrollment.package?.name ?? <span className="text-stone-300">—</span>}</div>
                    {enrollment.sessions_per_month && <div className="text-xs text-stone-400">{enrollment.sessions_per_month} aulas/mês</div>}
                </td>
                {/* Período */}
                <td className="px-5 py-4">
                    <div className="text-xs text-stone-400 mb-0.5">Início</div>
                    <div className="text-sm text-stone-600">{fmt(enrollment.start_date)}</div>
                    <div className="text-xs text-stone-400 mt-1">Término</div>
                    <div className="text-sm text-stone-600">{enrollment.end_date ? fmt(enrollment.end_date) : <span className="text-stone-300 text-xs">Sem término</span>}</div>
                </td>
                {/* Valor */}
                <td className="px-5 py-4">
                    <div className="text-sm font-bold text-stone-700">{money(enrollment.price)}</div>
                    {enrollment.payment_method && <div className="text-xs text-stone-400">{enrollment.payment_method}</div>}
                </td>
                {/* Mensalidades */}
                <td className="px-5 py-4">
                    {installments.length > 0 ? (
                        <div className="flex flex-col gap-1">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold w-fit">{paid} paga{paid !== 1 ? 's' : ''}</span>
                            {pending > 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold w-fit">{pending} pendente{pending !== 1 ? 's' : ''}</span>}
                        </div>
                    ) : <span className="text-xs text-stone-300">Sem parcelas</span>}
                </td>
                {/* Status */}
                <td className="px-5 py-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${st.cls}`}>{st.label}</span>
                </td>
                {/* Ações */}
                <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-1">
                        <button onClick={e => { e.stopPropagation(); onEdit(enrollment); }} className="p-1.5 text-stone-400 hover:text-[#466250] hover:bg-[#466250]/5 rounded-lg transition-colors" title="Editar">
                            <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                        <button onClick={e => { e.stopPropagation(); onDelete(enrollment); }} className="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Excluir">
                            <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                        <span className={`material-symbols-outlined text-stone-400 transition-transform ml-1 ${open ? 'rotate-180' : ''}`} style={{ fontSize: 20 }}>expand_more</span>
                    </div>
                </td>
            </tr>

            {/* Painel expandido — parcelas */}
            {open && (
                <tr>
                    <td colSpan={8} className="px-0 py-0 bg-[#f8faf9]">
                        <div className="px-6 py-5 border-t border-stone-100">
                            {installments.length === 0 ? (
                                <p className="text-sm text-stone-400 text-center py-4">Nenhuma mensalidade gerada para esta matrícula.</p>
                            ) : (
                                <>
                                    <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">Mensalidades</p>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                                        {installments.map(inst => {
                                            const overdue = !inst.paid && new Date(inst.due_date) < new Date();
                                            return (
                                                <div key={inst.id} className={`rounded-xl border p-3 flex flex-col gap-2 ${inst.paid ? 'bg-emerald-50 border-emerald-200' : overdue ? 'bg-red-50 border-red-200' : 'bg-white border-stone-200'}`}>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-bold text-stone-500">Parcela {inst.numero}</span>
                                                        {inst.paid ? <span className="material-symbols-outlined text-emerald-500" style={{ fontSize: 16 }}>check_circle</span>
                                                            : overdue ? <span className="material-symbols-outlined text-red-400" style={{ fontSize: 16 }}>warning</span>
                                                            : <span className="material-symbols-outlined text-amber-400" style={{ fontSize: 16 }}>schedule</span>}
                                                    </div>
                                                    <div className="text-sm font-bold text-stone-700">{money(inst.amount)}</div>
                                                    <div className="text-xs text-stone-400">Venc. {fmt(inst.due_date)}</div>
                                                    {inst.paid && inst.paid_at && <div className="text-xs text-emerald-600">Pago em {fmt(inst.paid_at)}</div>}
                                                    <button onClick={e => { e.stopPropagation(); togglePaid(inst); }} disabled={toggling === inst.id}
                                                        className={`mt-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${inst.paid ? 'bg-stone-100 text-stone-500 hover:bg-red-50 hover:text-red-500' : 'bg-[#466250] text-white hover:bg-[#384f40]'}`}>
                                                        {toggling === inst.id ? '...' : inst.paid ? 'Desfazer' : 'Marcar pago'}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <p className="text-xs text-stone-400 mt-3 text-right">
                                        Total: <span className="font-bold text-stone-600">{money(installments.reduce((s, i) => s + Number(i.amount), 0))}</span>
                                        {' · '}<span className="text-emerald-600 font-bold">{money(installments.filter(i => i.paid).reduce((s, i) => s + Number(i.amount), 0))} pago</span>
                                        {pending > 0 && <>{' · '}<span className="text-amber-600 font-bold">{money(installments.filter(i => !i.paid).reduce((s, i) => s + Number(i.amount), 0))} pendente</span></>}
                                    </p>
                                </>
                            )}
                            {enrollment.notes && (
                                <div className="mt-4 pt-4 border-t border-stone-100">
                                    <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">Observações</p>
                                    <p className="text-sm text-stone-600">{enrollment.notes}</p>
                                </div>
                            )}
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}

/* ─── Página principal ─────────────────────────────────────────────────── */
export default function MatriculasIndex({ enrollments: initialEnrollments, summary, filters, pilatesPackages, patients, paymentOptions, nextNumber }) {
    const [enrollments, setEnrollments] = useState(initialEnrollments);
    const [search, setSearch]           = useState(filters.search || '');
    const [status, setStatus]           = useState(filters.status || 'all');
    const [newModal, setNewModal]       = useState(false);
    const [editModal, setEditModal]     = useState(false);
    const [editTarget, setEditTarget]   = useState(null);
    const [deleteModal, setDeleteModal] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting]       = useState(false);

    useEffect(() => setEnrollments(initialEnrollments), [initialEnrollments]);

    useEffect(() => {
        const t = setTimeout(() => {
            router.get(route('pilates.matriculas.index'), { search, status: status === 'all' ? '' : status }, { preserveState: true, replace: true });
        }, 300);
        return () => clearTimeout(t);
    }, [search, status]);

    const handleSaved = (saved) => {
        setEnrollments(prev => {
            const idx = prev.findIndex(e => e.id === saved.id);
            if (idx >= 0) { const n = [...prev]; n[idx] = saved; return n; }
            return [saved, ...prev];
        });
    };

    const confirmDelete = async () => {
        setDeleting(true);
        try {
            await axios.delete(route('pilates.matriculas.destroy', deleteTarget.id));
            setEnrollments(prev => prev.filter(e => e.id !== deleteTarget.id));
            setDeleteModal(false); setDeleteTarget(null);
        } finally { setDeleting(false); }
    };

    const activeSummary = {
        total:    enrollments.length,
        active:   enrollments.filter(e => e.status === 'active').length,
        pending:  enrollments.reduce((s, e) => s + e.installments.filter(i => !i.paid).length, 0),
        revenue:  enrollments.filter(e => e.status === 'active').reduce((s, e) => s + Number(e.price), 0),
    };

    return (
        <AuthenticatedLayout>
            <Head title="Matrículas Pilates" />

            {/* Header */}
            <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-[#466250] mb-1">Matrículas — Pilates</h1>
                    <p className="text-stone-500">Gerencie contratos, planos e mensalidades dos alunos.</p>
                </div>
                <button onClick={() => setNewModal(true)}
                    className="bg-[#466250] text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-[#384f40] transition-all shadow-lg shadow-[#466250]/20 self-start md:self-auto">
                    <span className="material-symbols-outlined text-xl">add</span>
                    Nova Matrícula
                </button>
            </section>

            {/* Cards resumo */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                    { label: 'Total de Matrículas',     value: activeSummary.total,              icon: 'assignment',   bg: 'bg-stone-50',   text: 'text-stone-700' },
                    { label: 'Matrículas Ativas',        value: activeSummary.active,             icon: 'how_to_reg',   bg: 'bg-emerald-50', text: 'text-emerald-700' },
                    { label: 'Mensalidades Pendentes',   value: activeSummary.pending,            icon: 'payments',     bg: 'bg-amber-50',   text: 'text-amber-700' },
                    { label: 'Receita Mensal (ativos)',  value: money(activeSummary.revenue),     icon: 'trending_up',  bg: 'bg-blue-50',    text: 'text-blue-700' },
                ].map(({ label, value, icon, bg, text }) => (
                    <div key={label} className={`${bg} rounded-2xl p-5 flex items-center gap-4`}>
                        <div className="p-2 rounded-xl bg-white shadow-sm"><span className={`material-symbols-outlined ${text}`}>{icon}</span></div>
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
                    <input type="text" placeholder="Buscar por aluno, nº matrícula ou contrato..." className="pl-10 pr-4 py-2.5 bg-white border-stone-200 rounded-xl text-sm focus:ring-[#466250] focus:border-[#466250] w-full outline-none border"
                        value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div className="flex gap-2">
                    {[['all', 'Todos'], ['active', 'Ativos'], ['inactive', 'Inativos'], ['cancelled', 'Cancelados']].map(([val, label]) => (
                        <button key={val} onClick={() => setStatus(val)}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${status === val ? 'bg-[#466250] text-white' : 'bg-white text-stone-500 border border-stone-200 hover:bg-stone-50'}`}>
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
                                {['Nº Matrícula', 'Aluno', 'Plano', 'Período do Contrato', 'Valor', 'Mensalidades', 'Status', ''].map(h => (
                                    <th key={h} className="px-5 py-4 text-xs font-bold text-stone-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                            {enrollments.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center gap-3 text-stone-400">
                                            <span className="material-symbols-outlined text-5xl text-stone-300">assignment</span>
                                            <span>Nenhuma matrícula encontrada.</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : enrollments.map(e => (
                                <EnrollmentRow key={e.id} enrollment={e} paymentOptions={paymentOptions}
                                    onEdit={en => { setEditTarget(en); setEditModal(true); }}
                                    onDelete={en => { setDeleteTarget(en); setDeleteModal(true); }}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Nova Matrícula */}
            <EnrollmentModal
                show={newModal}
                onClose={() => setNewModal(false)}
                pilatesPackages={pilatesPackages}
                patients={patients}
                paymentOptions={paymentOptions}
                nextNumber={nextNumber}
                onSaved={handleSaved}
            />

            {/* Modal Editar */}
            <EditEnrollmentModal
                show={editModal}
                onClose={() => { setEditModal(false); setEditTarget(null); }}
                enrollment={editTarget}
                paymentOptions={paymentOptions}
                onSaved={handleSaved}
            />

            {/* Modal Confirmar Exclusão */}
            <Modal show={deleteModal} onClose={() => setDeleteModal(false)} maxWidth="md">
                <div className="p-8">
                    <div className="flex items-center gap-4 text-red-600 mb-4">
                        <span className="material-symbols-outlined text-4xl">warning</span>
                        <h2 className="text-xl font-bold">Confirmar Exclusão</h2>
                    </div>
                    <p className="text-stone-600 mb-2">Tem certeza que deseja excluir a matrícula</p>
                    <p className="font-mono font-bold text-[#466250] mb-1">{deleteTarget?.enrollment_number}</p>
                    <p className="text-stone-600 mb-8">de <span className="font-bold text-stone-900">{deleteTarget?.patient?.name}</span>?<br /><span className="text-sm text-red-500">Todas as mensalidades vinculadas também serão removidas.</span></p>
                    <div className="flex justify-end gap-3">
                        <SecondaryButton onClick={() => setDeleteModal(false)}>Cancelar</SecondaryButton>
                        <DangerButton onClick={confirmDelete} disabled={deleting}>{deleting ? 'Excluindo...' : 'Sim, Excluir'}</DangerButton>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
