import { useState, useEffect } from 'react';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import axios from 'axios';

export default function AssignPackageModal({ show, onClose, patient }) {
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [mensalidade, setMensalidade] = useState(false);
    const [parcelas, setParcelas] = useState([]);
    const [melhorData, setMelhorData] = useState(null);
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [paymentTypes, setPaymentTypes] = useState([]);

    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState({});
    const [data, setDataState] = useState({
        package_id: '',
        start_date: new Date().toISOString().split('T')[0],
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
            price: '',
            session_count: '',
            payment_type: '',
            payment_method: '',
            notes: '',
            mensalidade_meses: '',
        });
        setErrors({});
    };

    useEffect(() => {
        if (show) {
            fetchAllPackages();
            fetchPaymentOptions();
        }
    }, [show]);

    const fetchAllPackages = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get(route('packages.all'));
            setPackages(data);
        } catch (err) {
            console.error('Error fetching packages:', err);
        } finally {
            setLoading(false);
        }
    };

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
        const pkg = packages.find(p => p.id == packageId);
        setData({
            ...data,
            package_id: packageId,
            price: pkg?.price || '',
        });
    };

    // Recalculate parcelas
    useEffect(() => {
        if (!mensalidade) {
            setParcelas([]);
            return;
        }

        const numMeses = parseInt(data.mensalidade_meses);
        const valor = parseFloat(data.price);

        if (!numMeses || numMeses < 1 || !valor || !data.start_date) {
            setParcelas([]);
            return;
        }

        const start = new Date(data.start_date + 'T00:00:00');
        const dueDay = melhorData ?? start.getDate();
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const geradas = [];

        for (let i = 0; i < numMeses; i++) {
            const venc = new Date(start.getFullYear(), start.getMonth() + i, dueDay);
            geradas.push({
                numero: i + 1,
                due_date: venc.toISOString().split('T')[0],
                data: venc.toLocaleDateString('pt-BR'),
                amount: valor,
                valor: valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                paid: false,
                pago: false,
                vencida: venc < hoje,
            });
        }

        setParcelas(geradas);
    }, [mensalidade, data.mensalidade_meses, data.price, data.start_date, melhorData]);

    const handleClose = () => {
        reset();
        setMensalidade(false);
        setParcelas([]);
        setMelhorData(null);
        setPackages([]);
        onClose();
    };

    const submit = async (e) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});
        try {
            await axios.post(route('patients.packages.store', patient.id), {
                ...data,
                installments: mensalidade && parcelas.length > 0
                    ? parcelas.map(p => ({ numero: p.numero, due_date: p.due_date, amount: p.amount, paid: p.paid }))
                    : [],
            });
            reset();
            setMensalidade(false);
            setParcelas([]);
            setMelhorData(null);
            onClose();
        } catch (err) {
            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors);
            }
        } finally {
            setProcessing(false);
        }
    };

    return (
        <Modal show={show && !!patient} onClose={handleClose} maxWidth="lg">
            <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-[#466250]">Atribuir Plano</h2>
                        <p className="text-stone-500">Selecione um plano para <span className="font-bold text-stone-900">{patient?.name}</span></p>
                    </div>
                    <button onClick={handleClose} className="p-2 text-stone-400 hover:text-stone-600 transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <form onSubmit={submit} className="space-y-5">
                    {/* Package */}
                    <div>
                        <InputLabel htmlFor="package_id" value="Plano" />
                        <select
                            id="package_id"
                            className="mt-1 block w-full border-stone-200 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300 focus:border-primary focus:ring-primary rounded-xl shadow-sm"
                            value={data.package_id}
                            onChange={(e) => handlePackageChange(e.target.value)}
                            disabled={loading}
                            required
                        >
                            <option value="">{loading ? 'Carregando...' : 'Selecione um plano'}</option>
                            {packages.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.specialty_name ? `${p.specialty_name} — ${p.name}` : p.name}
                                </option>
                            ))}
                        </select>
                        <InputError message={errors.package_id} className="mt-2" />
                    </div>

                    {/* Start date + sessions + price */}
                    <div>
                        <InputLabel htmlFor="start_date" value="Data de Início" />
                        <TextInput
                            id="start_date"
                            type="date"
                            className="mt-1 block w-full"
                            value={data.start_date}
                            onChange={(e) => setData('start_date', e.target.value)}
                            required
                        />
                        <InputError message={errors.start_date} className="mt-2" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <InputLabel htmlFor="session_count" value="Qtd. de Sessões" />
                            <TextInput
                                id="session_count"
                                type="number"
                                min="1"
                                className="mt-1 block w-full"
                                value={data.session_count}
                                onChange={(e) => setData('session_count', e.target.value)}
                                placeholder="ex: 12"
                            />
                            <InputError message={errors.session_count} className="mt-2" />
                        </div>
                        <div>
                            <InputLabel htmlFor="price" value="Valor (R$)" />
                            <TextInput
                                id="price"
                                type="number"
                                step="0.01"
                                className="mt-1 block w-full"
                                value={data.price}
                                onChange={(e) => setData('price', e.target.value)}
                                required
                            />
                            <InputError message={errors.price} className="mt-2" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <InputLabel htmlFor="payment_method" value="Forma de Pagamento" />
                            <select
                                id="payment_method"
                                className="mt-1 block w-full border-stone-200 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300 focus:border-primary focus:ring-primary rounded-xl shadow-sm"
                                value={data.payment_method}
                                onChange={(e) => setData('payment_method', e.target.value)}
                            >
                                <option value="">Selecione</option>
                                {paymentMethods.map(m => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                            </select>
                            <InputError message={errors.payment_method} className="mt-2" />
                        </div>
                        <div>
                            <InputLabel htmlFor="payment_type" value="Tipo de Pagamento" />
                            <select
                                id="payment_type"
                                className="mt-1 block w-full border-stone-200 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300 focus:border-primary focus:ring-primary rounded-xl shadow-sm"
                                value={data.payment_type}
                                onChange={(e) => setData('payment_type', e.target.value)}
                            >
                                <option value="">Selecione</option>
                                {paymentTypes.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                            <InputError message={errors.payment_type} className="mt-2" />
                        </div>
                    </div>

                    {/* Mensalidade Toggle */}
                    <div
                        onClick={() => setMensalidade(!mensalidade)}
                        className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all select-none ${
                            mensalidade
                                ? 'border-[#466250] bg-[#466250]/5'
                                : 'border-stone-200 dark:border-stone-700 hover:border-stone-300'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <span className={`material-symbols-outlined text-xl ${mensalidade ? 'text-[#466250]' : 'text-stone-400'}`}>
                                calendar_month
                            </span>
                            <div>
                                <p className={`font-bold text-sm ${mensalidade ? 'text-[#466250]' : 'text-stone-700 dark:text-stone-300'}`}>
                                    Gerar Mensalidades
                                </p>
                                <p className="text-xs text-stone-400">Lançar parcelas com datas de vencimento</p>
                            </div>
                        </div>
                        <div className={`w-11 h-6 rounded-full transition-colors relative ${mensalidade ? 'bg-[#466250]' : 'bg-stone-300'}`}>
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${mensalidade ? 'left-6' : 'left-1'}`} />
                        </div>
                    </div>

                    {/* Mensalidade Fields */}
                    {mensalidade && (
                        <div className="space-y-4 p-4 bg-stone-50 dark:bg-stone-800/50 rounded-xl border border-stone-100 dark:border-stone-800">

                                {/* Meses + valor + melhor data */}
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <InputLabel htmlFor="mensalidade_meses" value="Qtd. Meses" />
                                    <TextInput
                                        id="mensalidade_meses"
                                        type="number"
                                        min="1"
                                        className="mt-1 block w-full"
                                        value={data.mensalidade_meses}
                                        onChange={(e) => setData('mensalidade_meses', e.target.value)}
                                        placeholder="ex: 3"
                                    />
                                </div>
                                <div>
                                    <InputLabel htmlFor="melhor_data" value="Melhor data pgto." />
                                    <TextInput
                                        id="melhor_data"
                                        type="number"
                                        min="1"
                                        max="31"
                                        className="mt-1 block w-full"
                                        placeholder="Dia (1-31)"
                                        value={melhorData ?? ''}
                                        onChange={(e) => {
                                            const v = parseInt(e.target.value);
                                            setMelhorData(e.target.value === '' ? null : (v >= 1 && v <= 31 ? v : melhorData));
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Parcelas Preview */}
                            {parcelas.length > 0 && (
                                <div>
                                    <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
                                        {parcelas.length} parcela{parcelas.length > 1 ? 's' : ''} gerada{parcelas.length > 1 ? 's' : ''}
                                    </p>
                                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                                        {parcelas.map((p) => (
                                            <div key={p.numero} className="flex items-center justify-between bg-white dark:bg-stone-900 px-3 py-2 rounded-lg border border-stone-100 dark:border-stone-800 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-5 h-5 rounded-full bg-[#466250]/10 text-[#466250] flex items-center justify-center text-[10px] font-bold">
                                                        {p.numero}
                                                    </span>
                                                    <span className="text-stone-600 dark:text-stone-400">{p.data}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="font-bold text-[#466250]">R$ {p.valor}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setParcelas(prev => prev.map(x =>
                                                            x.numero === p.numero ? { ...x, pago: !x.pago, paid: !x.paid } : x
                                                        ))}
                                                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${
                                                            p.pago
                                                                ? 'bg-emerald-100 text-emerald-700'
                                                                : p.vencida
                                                                    ? 'bg-red-100 text-red-600'
                                                                    : 'bg-amber-100 text-amber-600'
                                                        }`}
                                                    >
                                                        {p.pago ? 'Pago' : p.vencida ? 'Vencida' : 'Pendente'}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-xs text-stone-400 mt-2 text-right">
                                        Total: <span className="font-bold text-stone-600">
                                            R$ {(parseFloat(data.price) * parcelas.length).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </span>
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Notes */}
                    <div>
                        <InputLabel htmlFor="notes" value="Observações (Opcional)" />
                        <textarea
                            id="notes"
                            className="mt-1 block w-full border-stone-200 dark:border-stone-800 dark:bg-stone-900 focus:border-primary focus:ring-primary rounded-xl shadow-sm text-sm"
                            value={data.notes}
                            onChange={(e) => setData('notes', e.target.value)}
                            rows="2"
                        ></textarea>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <SecondaryButton onClick={handleClose} type="button">Cancelar</SecondaryButton>
                        <PrimaryButton disabled={processing}>Atribuir Plano</PrimaryButton>
                    </div>
                </form>
            </div>
        </Modal>
    );
}
