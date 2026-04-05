import { useState, useEffect } from 'react';
import Modal from '@/Components/Modal';
import axios from 'axios';

export default function PatientPlansModal({ show, onClose, patient, onAssignNew }) {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(false);
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [paymentTypes, setPaymentTypes] = useState([]);

    useEffect(() => {
        if (show && patient) {
            fetchPlans();
            fetchPaymentOptions();
        }
    }, [show, patient]);

    const fetchPlans = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get(route('patients.packages.index', patient.id));
            setPlans(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchPaymentOptions = async () => {
        try {
            const { data } = await axios.get(route('payment_options.index'));
            setPaymentMethods(data.filter(o => o.group === 'method'));
            setPaymentTypes(data.filter(o => o.group === 'type'));
        } catch (err) {
            console.error(err);
        }
    };

    const handleClose = () => {
        setPlans([]);
        onClose();
    };

    const updatePlan = (updated) => {
        setPlans(prev => prev.map(p => p.id === updated.id ? updated : p));
    };

    const updateInstallment = (planId, installmentId, updated) => {
        setPlans(prev => prev.map(p =>
            p.id === planId
                ? { ...p, installments: p.installments.map(i => i.id === installmentId ? { ...i, ...updated } : i) }
                : p
        ));
    };

    const statusLabel = (status) => {
        if (status === 'active')    return { label: 'Em andamento', cls: 'bg-emerald-100 text-emerald-700' };
        if (status === 'finished')  return { label: 'Finalizado',   cls: 'bg-stone-100 text-stone-500' };
        if (status === 'cancelled') return { label: 'Cancelado',    cls: 'bg-red-100 text-red-600' };
        return { label: status, cls: 'bg-stone-100 text-stone-500' };
    };

    const paymentStatusLabel = (ps) => {
        if (ps === 'paid')    return { label: 'Pago',     cls: 'bg-emerald-100 text-emerald-700' };
        if (ps === 'partial') return { label: 'Parcial',  cls: 'bg-amber-100 text-amber-600' };
        return                       { label: 'Pendente', cls: 'bg-red-100 text-red-500' };
    };

    const active   = plans.filter(p => p.status === 'active');
    const finished = plans.filter(p => p.status !== 'active');

    if (!patient) return null;

    return (
        <Modal show={show} onClose={handleClose} maxWidth="lg">
            <div className="p-8">
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-[#466250]">Planos do Paciente</h2>
                        <p className="text-stone-500 mt-0.5">
                            <span className="font-bold text-stone-800">{patient.name}</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onAssignNew(patient)}
                            className="flex items-center gap-1.5 px-4 py-2 bg-[#466250] text-white text-sm font-bold rounded-xl hover:bg-[#384f40] transition-colors"
                        >
                            <span className="material-symbols-outlined text-sm">add</span>
                            Novo Plano
                        </button>
                        <button onClick={handleClose} className="p-2 text-stone-400 hover:text-stone-600 transition-colors">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="py-12 flex justify-center">
                        <span className="text-stone-400 text-sm">Carregando...</span>
                    </div>
                ) : plans.length === 0 ? (
                    <div className="py-12 flex flex-col items-center gap-3 text-stone-400">
                        <span className="material-symbols-outlined text-4xl">inventory_2</span>
                        <p className="text-sm">Nenhum plano atribuído a este paciente.</p>
                        <button
                            onClick={() => onAssignNew(patient)}
                            className="mt-1 text-sm text-[#466250] font-bold hover:underline"
                        >
                            Atribuir primeiro plano
                        </button>
                    </div>
                ) : (
                    <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-1">
                        {active.length > 0 && (
                            <div>
                                <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Em andamento</p>
                                <div className="space-y-2">
                                    {active.map(pp => (
                                        <PlanCard key={pp.id} pp={pp}
                                            statusLabel={statusLabel}
                                            paymentStatusLabel={paymentStatusLabel}
                                            onInstallmentToggle={updateInstallment}
                                            onUpdate={updatePlan}
                                            paymentMethods={paymentMethods}
                                            paymentTypes={paymentTypes}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                        {finished.length > 0 && (
                            <div>
                                <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Histórico</p>
                                <div className="space-y-2">
                                    {finished.map(pp => (
                                        <PlanCard key={pp.id} pp={pp}
                                            statusLabel={statusLabel}
                                            paymentStatusLabel={paymentStatusLabel}
                                            onInstallmentToggle={updateInstallment}
                                            onUpdate={updatePlan}
                                            paymentMethods={paymentMethods}
                                            paymentTypes={paymentTypes}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Modal>
    );
}

function PlanCard({ pp, statusLabel, paymentStatusLabel, onInstallmentToggle, onUpdate, paymentMethods, paymentTypes }) {
    const [expanded, setExpanded] = useState(false);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editData, setEditData] = useState({});
    const [localInstallments, setLocalInstallments] = useState(localInstallments || []);

    useEffect(() => {
        setLocalInstallments(localInstallments || []);
    }, [localInstallments]);

    const { label: stLabel, cls: stCls } = statusLabel(pp.status);
    const { label: psLabel, cls: psCls } = paymentStatusLabel(pp.payment_status);
    const specialty = pp.package?.specialty?.name;
    const planName  = pp.package?.name;
    const hasInstallments = localInstallments.length > 0;
    const today = new Date(); today.setHours(0, 0, 0, 0);

    const startEdit = () => {
        setEditData({
            price:          pp.price,
            session_count:  pp.session_count || '',
            start_date:     pp.start_date,
            payment_method: pp.payment_method || '',
            payment_type:   pp.payment_type || '',
            payment_status: pp.payment_status || 'pending',
            status:         pp.status || 'active',
            notes:          pp.notes || '',
        });
        setEditing(true);
        setExpanded(false);
    };

    const cancelEdit = () => setEditing(false);

    const saveEdit = async () => {
        setSaving(true);
        try {
            const { data } = await axios.put(route('patients.packages.update', pp.id), editData);
            onUpdate(data);
            setEditing(false);
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const toggleInstallment = async (inst) => {
        try {
            const { data } = await axios.patch(route('installments.toggle', inst.id));
            setLocalInstallments(prev => prev.map(i => i.id === inst.id ? { ...i, paid: data.paid } : i));
            onInstallmentToggle(pp.id, inst.id, data);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="border border-stone-100 dark:border-stone-800 rounded-2xl overflow-hidden">
            {/* Summary row */}
            <div className="flex items-center gap-3 bg-stone-50 dark:bg-stone-800/50 px-4 py-3">
                <div className="w-9 h-9 rounded-xl bg-[#466250]/10 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-[#466250] text-sm">inventory_2</span>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-stone-800 dark:text-stone-200 truncate">
                        {specialty ? `${specialty} — ${planName}` : planName}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-stone-400">
                        <span>Início: {new Date(pp.start_date + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                        {pp.session_count && <span>· {pp.session_count} sessões</span>}
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm font-bold text-[#466250]">
                        R$ {parseFloat(pp.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${psCls}`}>{psLabel}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${stCls}`}>{stLabel}</span>
                    <button
                        onClick={startEdit}
                        className="p-1 text-stone-400 hover:text-[#466250] transition-colors rounded-lg"
                        title="Editar"
                    >
                        <span className="material-symbols-outlined text-base">edit</span>
                    </button>
                    <button
                        onClick={() => { setExpanded(v => !v); setEditing(false); }}
                        className="p-1 text-stone-400 hover:text-[#466250] transition-colors rounded-lg"
                        title="Ver detalhes"
                    >
                        <span className="material-symbols-outlined text-base">
                            {expanded ? 'expand_less' : 'expand_more'}
                        </span>
                    </button>
                </div>
            </div>

            {/* Edit panel */}
            {editing && (
                <div className="px-4 py-4 bg-[#466250]/5 border-t border-[#466250]/20 space-y-3">
                    <p className="text-xs font-bold text-[#466250] uppercase tracking-wider">Editar Plano</p>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-stone-500 font-medium">Data de Início</label>
                            <input type="date" className="mt-1 w-full text-sm border-stone-200 dark:border-stone-700 dark:bg-stone-800 rounded-xl shadow-sm"
                                value={editData.start_date}
                                onChange={e => setEditData(d => ({ ...d, start_date: e.target.value }))} />
                        </div>
                        <div>
                            <label className="text-xs text-stone-500 font-medium">Qtd. de Sessões</label>
                            <input type="number" min="1" className="mt-1 w-full text-sm border-stone-200 dark:border-stone-700 dark:bg-stone-800 rounded-xl shadow-sm"
                                value={editData.session_count}
                                onChange={e => setEditData(d => ({ ...d, session_count: e.target.value }))} />
                        </div>
                        <div>
                            <label className="text-xs text-stone-500 font-medium">Valor (R$)</label>
                            <input type="number" step="0.01" className="mt-1 w-full text-sm border-stone-200 dark:border-stone-700 dark:bg-stone-800 rounded-xl shadow-sm"
                                value={editData.price}
                                onChange={e => setEditData(d => ({ ...d, price: e.target.value }))} />
                        </div>
                        <div>
                            <label className="text-xs text-stone-500 font-medium">Status de Pagamento</label>
                            <select className="mt-1 w-full text-sm border-stone-200 dark:border-stone-700 dark:bg-stone-800 rounded-xl shadow-sm"
                                value={editData.payment_status}
                                onChange={e => setEditData(d => ({ ...d, payment_status: e.target.value }))}>
                                <option value="pending">Pendente</option>
                                <option value="partial">Parcial</option>
                                <option value="paid">Pago</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-stone-500 font-medium">Forma de Pagamento</label>
                            <select className="mt-1 w-full text-sm border-stone-200 dark:border-stone-700 dark:bg-stone-800 rounded-xl shadow-sm"
                                value={editData.payment_method}
                                onChange={e => setEditData(d => ({ ...d, payment_method: e.target.value }))}>
                                <option value="">Selecione</option>
                                {paymentMethods.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-stone-500 font-medium">Tipo de Pagamento</label>
                            <select className="mt-1 w-full text-sm border-stone-200 dark:border-stone-700 dark:bg-stone-800 rounded-xl shadow-sm"
                                value={editData.payment_type}
                                onChange={e => setEditData(d => ({ ...d, payment_type: e.target.value }))}>
                                <option value="">Selecione</option>
                                {paymentTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-stone-500 font-medium">Status do Plano</label>
                            <select className="mt-1 w-full text-sm border-stone-200 dark:border-stone-700 dark:bg-stone-800 rounded-xl shadow-sm"
                                value={editData.status}
                                onChange={e => setEditData(d => ({ ...d, status: e.target.value }))}>
                                <option value="active">Em andamento</option>
                                <option value="finished">Finalizado</option>
                                <option value="cancelled">Cancelado</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-stone-500 font-medium">Observações</label>
                        <textarea rows="2" className="mt-1 w-full text-sm border-stone-200 dark:border-stone-700 dark:bg-stone-800 rounded-xl shadow-sm"
                            value={editData.notes}
                            onChange={e => setEditData(d => ({ ...d, notes: e.target.value }))} />
                    </div>
                    {/* Mensalidades no modo edição */}
                    {hasInstallments && (
                        <div>
                            <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
                                Mensalidades ({localInstallments.filter(i => i.paid).length}/{localInstallments.length} pagas)
                            </p>
                            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                                {localInstallments.map(inst => {
                                    const dueDate = new Date(inst.due_date + 'T00:00:00');
                                    const overdue = !inst.paid && dueDate < today;
                                    return (
                                        <div key={inst.id} className="flex items-center justify-between bg-white dark:bg-stone-900 px-3 py-2 rounded-xl border border-stone-100 dark:border-stone-800 text-sm">
                                            <div className="flex items-center gap-2">
                                                <span className="w-5 h-5 rounded-full bg-[#466250]/10 text-[#466250] flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                                                    {inst.numero}
                                                </span>
                                                <span className="text-stone-600 dark:text-stone-400">
                                                    {dueDate.toLocaleDateString('pt-BR')}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="font-bold text-[#466250]">
                                                    R$ {parseFloat(inst.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => toggleInstallment(inst)}
                                                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition-colors ${
                                                        inst.paid
                                                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                                            : overdue
                                                                ? 'bg-red-100 text-red-600 hover:bg-red-200'
                                                                : 'bg-amber-100 text-amber-600 hover:bg-amber-200'
                                                    }`}
                                                >
                                                    {inst.paid ? 'Pago' : overdue ? 'Vencida' : 'Pendente'}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <p className="text-xs text-stone-400 mt-2 text-right">
                                Total: <span className="font-bold text-stone-600">
                                    R$ {localInstallments.reduce((s, i) => s + parseFloat(i.amount), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                            </p>
                        </div>
                    )}

                    <div className="flex justify-end gap-2 pt-1">
                        <button type="button" onClick={cancelEdit}
                            className="px-3 py-2 text-sm text-stone-400 hover:text-stone-600 rounded-xl hover:bg-stone-100 transition-colors">
                            Cancelar
                        </button>
                        <button type="button" onClick={saveEdit} disabled={saving}
                            className="px-4 py-2 bg-[#466250] text-white text-sm font-bold rounded-xl hover:bg-[#384f40] transition-colors disabled:opacity-40">
                            {saving ? 'Salvando...' : 'Salvar'}
                        </button>
                    </div>
                </div>
            )}

            {/* Detail panel */}
            {expanded && !editing && (
                <div className="px-4 py-4 bg-white dark:bg-stone-900 border-t border-stone-100 dark:border-stone-800 space-y-4">
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                        <DetailRow icon="calendar_today" label="Data de Início"
                            value={new Date(pp.start_date + 'T00:00:00').toLocaleDateString('pt-BR')} />
                        <DetailRow icon="tag" label="Qtd. de Sessões"
                            value={pp.session_count ? `${pp.session_count} sessões` : '—'} />
                        <DetailRow icon="payments" label="Valor"
                            value={`R$ ${parseFloat(pp.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                        <DetailRow icon="credit_card" label="Forma de Pagamento"
                            value={pp.payment_method_name || '—'} />
                        <DetailRow icon="receipt_long" label="Tipo de Pagamento"
                            value={pp.payment_type_name || '—'} />
                        <DetailRow icon="payments" label="Status de Pagamento"
                            value={psLabel}
                            valueClass={`font-bold ${pp.payment_status === 'paid' ? 'text-emerald-600' : pp.payment_status === 'partial' ? 'text-amber-600' : 'text-red-500'}`} />
                    </div>

                    {pp.notes && (
                        <div>
                            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">Observações</p>
                            <p className="text-sm text-stone-600 dark:text-stone-400 bg-stone-50 dark:bg-stone-800 rounded-xl px-3 py-2">{pp.notes}</p>
                        </div>
                    )}

                    {hasInstallments && (
                        <div>
                            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">
                                Mensalidades ({localInstallments.filter(i => i.paid).length}/{localInstallments.length} pagas)
                            </p>
                            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                                {localInstallments.map(inst => {
                                    const dueDate = new Date(inst.due_date + 'T00:00:00');
                                    const overdue = !inst.paid && dueDate < today;
                                    return (
                                        <div key={inst.id} className="flex items-center justify-between bg-stone-50 dark:bg-stone-800/50 px-3 py-2 rounded-xl border border-stone-100 dark:border-stone-800 text-sm">
                                            <div className="flex items-center gap-2">
                                                <span className="w-5 h-5 rounded-full bg-[#466250]/10 text-[#466250] flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                                                    {inst.numero}
                                                </span>
                                                <span className="text-stone-600 dark:text-stone-400">
                                                    {dueDate.toLocaleDateString('pt-BR')}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="font-bold text-[#466250]">
                                                    R$ {parseFloat(inst.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => toggleInstallment(inst)}
                                                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition-colors ${
                                                        inst.paid
                                                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                                            : overdue
                                                                ? 'bg-red-100 text-red-600 hover:bg-red-200'
                                                                : 'bg-amber-100 text-amber-600 hover:bg-amber-200'
                                                    }`}
                                                >
                                                    {inst.paid ? 'Pago' : overdue ? 'Vencida' : 'Pendente'}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <p className="text-xs text-stone-400 mt-2 text-right">
                                Total: <span className="font-bold text-stone-600">
                                    R$ {localInstallments.reduce((s, i) => s + parseFloat(i.amount), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function DetailRow({ icon, label, value, valueClass = 'text-stone-700 dark:text-stone-300' }) {
    return (
        <div className="flex items-start gap-2">
            <span className="material-symbols-outlined text-stone-300 text-base mt-0.5">{icon}</span>
            <div>
                <p className="text-xs text-stone-400">{label}</p>
                <p className={`font-medium ${valueClass}`}>{value}</p>
            </div>
        </div>
    );
}
