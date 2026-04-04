import { useState, useEffect } from 'react';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import { useForm } from '@inertiajs/react';

export default function PackageManagementModal({ show, onClose, specialty }) {
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(false);

    const { data, setData, post, processing, errors, reset, delete: destroy } = useForm({
        name: '',
        session_count: '',
        sessions_per_week: '',
        price: '',
        duration_months: '',
        billing_day: '',
        start_date: '',
        end_date: '',
    });

    useEffect(() => {
        if (data.start_date && data.duration_months) {
            const startDate = new Date(data.start_date + 'T00:00:00');
            const duration = parseInt(data.duration_months);
            
            if (!isNaN(startDate.getTime()) && !isNaN(duration)) {
                const endDate = new Date(startDate);
                endDate.setMonth(startDate.getMonth() + duration);
                
                // Format back to YYYY-MM-DD
                const year = endDate.getFullYear();
                const month = String(endDate.getMonth() + 1).padStart(2, '0');
                const day = String(endDate.getDate()).padStart(2, '0');
                setData('end_date', `${year}-${month}-${day}`);
            }
        }
    }, [data.start_date, data.duration_months]);

    useEffect(() => {
        if (show && specialty) {
            fetchPackages();
        }
    }, [show, specialty]);

    const fetchPackages = async () => {
        setLoading(true);
        try {
            const response = await fetch(route('packages.index', specialty.id));
            const data = await response.json();
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
        if (confirm('Tem certeza que deseja excluir este pacote?')) {
            destroy(route('destroy', packageId), {
                onSuccess: () => fetchPackages(),
            });
        }
    };

    if (!specialty) return null;

    return (
        <Modal show={show} onClose={onClose} maxWidth="2xl">
            <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-[#466250]">Pacotes: {specialty.name}</h2>
                        <p className="text-stone-500">Gerencie os pacotes de sessões para esta especialidade.</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-600 transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Add New Package Form */}
                    <div className="bg-stone-50 dark:bg-stone-800/50 p-6 rounded-2xl border border-stone-100 dark:border-stone-800 h-fit">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">add_circle</span>
                            Novo Pacote
                        </h3>
                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <InputLabel htmlFor="name" value="Nome do Pacote (ex: Pacote Trimestral)" />
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

                            <div className="grid grid-cols-2 gap-4">
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
                                    <InputLabel htmlFor="sessions_per_week" value="Vezes na Semana (Opcional)" />
                                    <TextInput
                                        id="sessions_per_week"
                                        type="number"
                                        className="mt-1 block w-full"
                                        value={data.sessions_per_week}
                                        onChange={(e) => setData('sessions_per_week', e.target.value)}
                                    />
                                    <InputError message={errors.sessions_per_week} className="mt-2" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <InputLabel htmlFor="duration_months" value="Duração (Meses)" />
                                    <TextInput
                                        id="duration_months"
                                        type="number"
                                        className="mt-1 block w-full"
                                        value={data.duration_months}
                                        onChange={(e) => setData('duration_months', e.target.value)}
                                        placeholder="ex: 3"
                                    />
                                    <InputError message={errors.duration_months} className="mt-2" />
                                </div>
                                <div>
                                    <InputLabel htmlFor="billing_day" value="Dia de Cobrança" />
                                    <TextInput
                                        id="billing_day"
                                        type="number"
                                        min="1"
                                        max="31"
                                        className="mt-1 block w-full"
                                        value={data.billing_day}
                                        onChange={(e) => setData('billing_day', e.target.value)}
                                        placeholder="ex: 10"
                                    />
                                    <InputError message={errors.billing_day} className="mt-2" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <InputLabel htmlFor="start_date" value="Início" />
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
                                <div>
                                    <InputLabel htmlFor="end_date" value="Término (Auto)" />
                                    <TextInput
                                        id="end_date"
                                        type="date"
                                        className="mt-1 block w-full bg-stone-50"
                                        value={data.end_date}
                                        onChange={(e) => setData('end_date', e.target.value)}
                                        readOnly
                                    />
                                    <InputError message={errors.end_date} className="mt-2" />
                                </div>
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
                                Cadastrar Pacote
                            </PrimaryButton>
                        </form>
                    </div>

                    {/* Packages List */}
                    <div>
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">list</span>
                            Pacotes Ativos
                        </h3>
                        {loading ? (
                            <div className="flex justify-center p-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                        ) : packages.length === 0 ? (
                            <div className="text-center py-12 bg-white dark:bg-stone-900 rounded-2xl border border-dashed border-stone-200 dark:border-stone-800">
                                <span className="material-symbols-outlined text-4xl text-stone-200 mb-2">inventory_2</span>
                                <p className="text-stone-400">Nenhum pacote cadastrado.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {packages.map((pkg) => (
                                    <div key={pkg.id} className="p-4 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-xl shadow-sm hover:shadow-md transition-shadow flex justify-between items-center group">
                                        <div className="flex-1">
                                            <div className="font-bold text-stone-800 dark:text-stone-200 flex items-center gap-2">
                                                {pkg.name}
                                                {pkg.duration_months && (
                                                    <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                                                        {pkg.duration_months} meses
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs text-stone-500 mt-1 space-y-1">
                                                <div className="flex gap-3">
                                                    <span>{pkg.session_count} sessões</span>
                                                    <span>{pkg.sessions_per_week}x / semana</span>
                                                </div>
                                                <div className="flex flex-wrap gap-x-3 gap-y-1">
                                                    {pkg.billing_day && (
                                                        <span className="flex items-center gap-1 text-[#466250]">
                                                            <span className="material-symbols-outlined text-xs">event_repeat</span>
                                                            Cobrança dia {pkg.billing_day}
                                                        </span>
                                                    )}
                                                    {(pkg.start_date || pkg.end_date) && (
                                                        <span className="flex items-center gap-1">
                                                            <span className="material-symbols-outlined text-xs">calendar_today</span>
                                                            {pkg.start_date ? new Date(pkg.start_date).toLocaleDateString('pt-BR') : '...'} - {pkg.end_date ? new Date(pkg.end_date).toLocaleDateString('pt-BR') : '...'}
                                                        </span>
                                                    )}
                                                </div>
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
