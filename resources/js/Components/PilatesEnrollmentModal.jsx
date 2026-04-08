import { useState, useEffect } from 'react';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import axios from 'axios';

export default function PilatesEnrollmentModal({ show, onClose, pilatesPackages = [], patients = [] }) {
    const [search, setSearch] = useState('');
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [step, setStep] = useState('select_person'); // 'select_person' | 'fill_plan'

    const [mensalidade, setMensalidade] = useState(false);
    const [parcelas, setParcelas] = useState([]);
    const [melhorData, setMelhorData] = useState(null);
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [paymentTypes, setPaymentTypes] = useState([]);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState({});
    const [instStartDate, setInstStartDate] = useState('');
    const [instEndDate, setInstEndDate] = useState('');

    const [data, setDataState] = useState({
        package_id: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        price: '',
        session_count: '',
        payment_type: '',
        payment_method: '',
        notes: '',
        mensalidade_meses: '',
    });

    const setData = (keyOrObj, value) => {
        if (typeof keyOrObj === 'object') {
            setDataState(keyOrObj);
        } else {
            setDataState(prev => ({ ...prev, [keyOrObj]: value }));
        }
    };

    const reset = () => {
        setDataState({
            package_id: '',
            start_date: new Date().toISOString().split('T')[0],
            end_date: '',
            price: '',
            session_count: '',
            payment_type: '',
            payment_method: '',
            notes: '',
            mensalidade_meses: '',
        });
        setInstStartDate('');
        setInstEndDate('');
        setErrors({});
        setMensalidade(false);
        setParcelas([]);
        setMelhorData(null);
        setSelectedPatient(null);
        setSearch('');
        setStep('select_person');
    };

    useEffect(() => {
        if (show) fetchPaymentOptions();
    }, [show]);

    const fetchPaymentOptions = async () => {
        try {
            const { data: options } = await axios.get(route('payment_options.index'));
            setPaymentMethods(options.filter(o => o.group === 'method'));
            setPaymentTypes(options.filter(o => o.group === 'type'));
        } catch (err) {
            console.error(err);
        }
    };

    const handlePackageChange = (packageId) => {
        const pkg = pilatesPackages.find(p => p.id == packageId);
        setData({ ...data, package_id: packageId, price: pkg?.price || '' });
    };

    // Auto-calcula meses a partir das datas das parcelas
    useEffect(() => {
        if (!instStartDate || !instEndDate) return;
        const start = new Date(instStartDate + 'T00:00:00');
        const end   = new Date(instEndDate   + 'T00:00:00');
        if (end <= start) return;
        const meses = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
        if (meses > 0) setData('mensalidade_meses', String(meses));
    }, [instStartDate, instEndDate]);

    useEffect(() => {
        if (!instStartDate && data.start_date) setInstStartDate(data.start_date);
    }, [data.start_date]);

    useEffect(() => {
        if (!mensalidade) { setParcelas([]); return; }
        const numMeses = parseInt(data.mensalidade_meses);
        const valor    = parseFloat(data.price);
        const baseDate = instStartDate || data.start_date;
        if (!numMeses || numMeses < 1 || !valor || !baseDate) { setParcelas([]); return; }
        const start  = new Date(baseDate + 'T00:00:00');
        const dueDay = melhorData ?? start.getDate();
        const hoje   = new Date(); hoje.setHours(0, 0, 0, 0);
        const geradas = [];
        for (let i = 0; i < numMeses; i++) {
            const venc = new Date(start.getFullYear(), start.getMonth() + i, dueDay);
            geradas.push({
                numero: i + 1,
                due_date: venc.toISOString().split('T')[0],
                data: venc.toLocaleDateString('pt-BR'),
                amount: valor,
                valor: valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                paid: false, pago: false,
                vencida: venc < hoje,
            });
        }
        setParcelas(geradas);
    }, [mensalidade, data.mensalidade_meses, data.price, data.start_date, instStartDate, melhorData]);

    const handleClose = () => { reset(); onClose(); };

    const filteredPatients = patients.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.cpf && p.cpf.includes(search))
    );

    const submit = async (e) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});
        try {
            await axios.post(route('patients.packages.store', selectedPatient.id), {
                ...data,
                installments: mensalidade && parcelas.length > 0
                    ? parcelas.map(p => ({ numero: p.numero, due_date: p.due_date, amount: p.amount, paid: p.paid }))
                    : [],
            });
            reset();
            onClose();
        } catch (err) {
            if (err.response?.data?.errors) setErrors(err.response.data.errors);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <Modal show={show} onClose={handleClose} maxWidth="lg">
            <div className="p-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-[#466250]">Nova Matrícula</h2>
                        <p className="text-stone-500">
                            {step === 'select_person'
                                ? 'Selecione o aluno no cadastro'
                                : <>Matriculando <span className="font-bold text-stone-800">{selectedPatient?.name}</span></>
                            }
                        </p>
                    </div>
                    <button onClick={handleClose} className="p-2 text-stone-400 hover:text-stone-600 transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Step 1: Selecionar pessoa */}
                {step === 'select_person' && (
                    <div className="space-y-4">
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">search</span>
                            <input
                                type="text"
                                placeholder="Buscar por nome ou CPF..."
                                className="pl-10 pr-4 py-2.5 w-full border border-stone-200 rounded-xl text-sm focus:ring-[#466250] focus:border-[#466250] outline-none"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
                            {filteredPatients.length === 0 ? (
                                <div className="text-center py-8 text-stone-400">
                                    <span className="material-symbols-outlined text-3xl text-stone-300">person_search</span>
                                    <p className="text-sm mt-2">Nenhuma pessoa encontrada.</p>
                                    <p className="text-xs mt-1">
                                        <a href={route('patients.create')} className="text-[#466250] underline">Criar novo cadastro</a>
                                    </p>
                                </div>
                            ) : (
                                filteredPatients.map(p => (
                                    <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => { setSelectedPatient(p); setStep('fill_plan'); }}
                                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#466250]/5 border border-transparent hover:border-[#466250]/20 transition-all text-left"
                                    >
                                        <div className="w-9 h-9 rounded-full bg-[#466250]/10 flex items-center justify-center flex-shrink-0">
                                            <span className="material-symbols-outlined text-[#466250] text-lg">person</span>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="font-semibold text-stone-800 text-sm">{p.name}</div>
                                            <div className="text-xs text-stone-400">
                                                {p.cpf && <span className="mr-3">{p.cpf}</span>}
                                                {p.phone && <span>{p.phone}</span>}
                                            </div>
                                        </div>
                                        <span className="material-symbols-outlined text-stone-300">chevron_right</span>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* Step 2: Preencher plano */}
                {step === 'fill_plan' && (
                    <form onSubmit={submit} className="space-y-5">
                        {/* Voltar */}
                        <button
                            type="button"
                            onClick={() => setStep('select_person')}
                            className="flex items-center gap-1 text-sm text-stone-500 hover:text-[#466250] transition-colors mb-2"
                        >
                            <span className="material-symbols-outlined text-sm">arrow_back</span>
                            Trocar aluno
                        </button>

                        {/* Plano */}
                        <div>
                            <InputLabel htmlFor="package_id" value="Plano de Pilates" />
                            <select
                                id="package_id"
                                className="mt-1 block w-full border-stone-200 focus:border-[#466250] focus:ring-[#466250] rounded-xl shadow-sm"
                                value={data.package_id}
                                onChange={(e) => handlePackageChange(e.target.value)}
                                required
                            >
                                <option value="">Selecione um plano</option>
                                {pilatesPackages.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                            <InputError message={errors.package_id} className="mt-2" />
                        </div>

                        {/* Datas */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <InputLabel htmlFor="start_date" value="Início da Matrícula" />
                                <TextInput id="start_date" type="date" className="mt-1 block w-full" value={data.start_date} onChange={(e) => setData('start_date', e.target.value)} required />
                                <InputError message={errors.start_date} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="end_date" value="Término (opcional)" />
                                <TextInput id="end_date" type="date" className="mt-1 block w-full" value={data.end_date} onChange={(e) => setData('end_date', e.target.value)} min={data.start_date || undefined} />
                                <InputError message={errors.end_date} className="mt-2" />
                            </div>
                        </div>

                        {/* Valor + Sessões */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <InputLabel htmlFor="price" value="Valor do Plano (R$)" />
                                <TextInput id="price" type="number" step="0.01" className="mt-1 block w-full" value={data.price} onChange={(e) => setData('price', e.target.value)} required />
                                <InputError message={errors.price} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="session_count" value="Aulas por Mês" />
                                <TextInput id="session_count" type="number" min="1" className="mt-1 block w-full" value={data.session_count} onChange={(e) => setData('session_count', e.target.value)} placeholder="ex: 12" />
                                <InputError message={errors.session_count} className="mt-2" />
                            </div>
                        </div>

                        {/* Forma e Tipo de Pagamento */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <InputLabel htmlFor="payment_method" value="Forma de Pagamento" />
                                <select id="payment_method" className="mt-1 block w-full border-stone-200 focus:border-[#466250] focus:ring-[#466250] rounded-xl shadow-sm" value={data.payment_method} onChange={(e) => setData('payment_method', e.target.value)}>
                                    <option value="">Selecione</option>
                                    {paymentMethods.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <InputLabel htmlFor="payment_type" value="Tipo de Pagamento" />
                                <select id="payment_type" className="mt-1 block w-full border-stone-200 focus:border-[#466250] focus:ring-[#466250] rounded-xl shadow-sm" value={data.payment_type} onChange={(e) => setData('payment_type', e.target.value)}>
                                    <option value="">Selecione</option>
                                    {paymentTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Toggle Mensalidades */}
                        <div
                            onClick={() => setMensalidade(!mensalidade)}
                            className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all select-none ${mensalidade ? 'border-[#466250] bg-[#466250]/5' : 'border-stone-200 hover:border-stone-300'}`}
                        >
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

                        {/* Mensalidades */}
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
                                        <TextInput id="meses" type="number" min="1" className="mt-1 block w-full" value={data.mensalidade_meses} onChange={e => { setData('mensalidade_meses', e.target.value); setInstEndDate(''); }} placeholder="ex: 3" />
                                    </div>
                                    <div>
                                        <InputLabel htmlFor="melhor_data" value="Melhor dia de pgto." />
                                        <TextInput id="melhor_data" type="number" min="1" max="31" className="mt-1 block w-full" placeholder="Dia (1-31)" value={melhorData ?? ''} onChange={e => { const v = parseInt(e.target.value); setMelhorData(e.target.value === '' ? null : (v >= 1 && v <= 31 ? v : melhorData)); }} />
                                    </div>
                                </div>
                                {parcelas.length > 0 && (
                                    <div>
                                        <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">{parcelas.length} parcela{parcelas.length > 1 ? 's' : ''} gerada{parcelas.length > 1 ? 's' : ''}</p>
                                        <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
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
                            <textarea id="notes" className="mt-1 block w-full border-stone-200 focus:border-[#466250] focus:ring-[#466250] rounded-xl shadow-sm text-sm" value={data.notes} onChange={(e) => setData('notes', e.target.value)} rows="2" />
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <SecondaryButton type="button" onClick={handleClose}>Cancelar</SecondaryButton>
                            <PrimaryButton disabled={processing}>
                                {processing ? 'Salvando...' : 'Confirmar Matrícula'}
                            </PrimaryButton>
                        </div>
                    </form>
                )}
            </div>
        </Modal>
    );
}
