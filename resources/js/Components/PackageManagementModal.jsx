import { useState, useEffect } from 'react';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import { useForm } from '@inertiajs/react';
import axios from 'axios';

export default function PackageManagementModal({ show, onClose, specialty }) {
    const durationUnits = [
        { value: 'minutes', label: 'Minutos' },
        { value: 'months', label: 'Meses' },
        { value: 'sessions', label: 'Sessões' },
    ];

    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(false);

    const { data, setData, post, processing, errors, reset, delete: destroy } = useForm({
        name: '',
        session_count: '',
        price: '',
        duration_value: '',
        duration_unit: 'months',
    });

    useEffect(() => {
        if (show && specialty) {
            fetchPackages();
        }
    }, [show, specialty]);

    const fetchPackages = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get(route('packages.index', specialty.id));
            setPackages(data);
        } catch (error) {
            console.error('Error fetching packages:', error);
        } finally {
            setLoading(false);
        }
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('packages.store', specialty.id), {
            onSuccess: () => {
                reset();
                fetchPackages();
            },
        });
    };

    const deletePackage = (packageId) => {
        if (confirm('Tem certeza que deseja excluir este plano?')) {
            destroy(route('destroy', packageId), {
                onSuccess: () => fetchPackages(),
            });
        }
    };

    const durationLabel = (pkg) => {
        const value = pkg.duration_value || pkg.duration_months;
        const unit = pkg.duration_unit || (pkg.duration_months ? 'months' : null);
        if (!value || !unit) return null;

        const labels = {
            minutes: 'minutos',
            months: 'meses',
            sessions: 'sessões',
        };

        return `${value} ${labels[unit] ?? unit}`;
    };

    if (!specialty) return null;

    return (
        <Modal show={show} onClose={onClose} maxWidth="2xl">
            <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-[#466250]">Planos: {specialty.name}</h2>
                        <p className="text-stone-500">Gerencie os planos de sessões para esta especialidade.</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-600 transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-stone-50 dark:bg-stone-800/50 p-6 rounded-2xl border border-stone-100 dark:border-stone-800 h-fit">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">add_circle</span>
                            Novo Plano
                        </h3>
                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <InputLabel htmlFor="name" value="Nome do Plano (ex: Plano Trimestral)" />
                                <TextInput
                                    id="name"
                                    type="text"
                                    className="mt-1 block w-full"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    required
                                />
                                <InputError message={errors.name} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="session_count" value="Nº de Sessões (Opcional)" />
                                <TextInput
                                    id="session_count"
                                    type="number"
                                    className="mt-1 block w-full"
                                    value={data.session_count}
                                    onChange={(e) => setData('session_count', e.target.value)}
                                />
                                <InputError message={errors.session_count} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="duration_value" value="Duração" />
                                <div className="mt-1 flex gap-2">
                                    <TextInput
                                        id="duration_value"
                                        type="number"
                                        min="1"
                                        className="block w-1/2"
                                        value={data.duration_value}
                                        onChange={(e) => setData('duration_value', e.target.value)}
                                        placeholder="Valor"
                                    />
                                    <select
                                        className="w-1/2 border-stone-200 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 rounded-xl shadow-sm focus:border-primary focus:ring-primary"
                                        value={data.duration_unit}
                                        onChange={(e) => setData('duration_unit', e.target.value)}
                                    >
                                        {durationUnits.map((unit) => (
                                            <option key={unit.value} value={unit.value}>{unit.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <InputError message={errors.duration_value} className="mt-2" />
                                <InputError message={errors.duration_unit} className="mt-2" />
                            </div>

                            <div>
                                <InputLabel htmlFor="price" value="Valor Mensal (R$)" />
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

                            <PrimaryButton className="w-full justify-center py-3" disabled={processing}>
                                Cadastrar Plano
                            </PrimaryButton>
                        </form>
                    </div>

                    <div>
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">list</span>
                            Planos Ativos
                        </h3>
                        {loading ? (
                            <div className="flex justify-center p-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                        ) : packages.length === 0 ? (
                            <div className="text-center py-12 bg-white dark:bg-stone-900 rounded-2xl border border-dashed border-stone-200 dark:border-stone-800">
                                <span className="material-symbols-outlined text-4xl text-stone-200 mb-2">inventory_2</span>
                                <p className="text-stone-400">Nenhum plano cadastrado.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {packages.map((pkg) => (
                                    <div key={pkg.id} className="p-4 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-xl shadow-sm hover:shadow-md transition-shadow flex justify-between items-center group">
                                        <div className="flex-1">
                                            <div className="font-bold text-stone-800 dark:text-stone-200">
                                                {pkg.name}
                                            </div>
                                            <div className="text-xs text-stone-500 mt-1 space-y-1">
                                                {pkg.session_count && (
                                                    <div>{pkg.session_count} sessões</div>
                                                )}
                                                {durationLabel(pkg) && (
                                                    <div>Duração: {durationLabel(pkg)}</div>
                                                )}
                                                <div className="font-bold text-[#466250] text-sm pt-1">
                                                    R$ {parseFloat(pkg.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} /mês
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => deletePackage(pkg.id)}
                                            className="p-2 text-stone-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <span className="material-symbols-outlined text-sm">delete</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-8 flex justify-end">
                    <SecondaryButton onClick={onClose}>Fechar</SecondaryButton>
                </div>
            </div>
        </Modal>
    );
}

