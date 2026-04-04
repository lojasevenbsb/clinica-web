import { useState, useEffect } from 'react';
import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import { useForm } from '@inertiajs/react';

export default function AssignPackageModal({ show, onClose, patient }) {
    const [specialties, setSpecialties] = useState([]);
    const [selectedSpecialty, setSelectedSpecialty] = useState(null);
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        package_id: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        billing_day: '',
        price: '',
        notes: '',
    });

    useEffect(() => {
        if (show) {
            fetchSpecialties();
        }
    }, [show]);

    const fetchSpecialties = async () => {
        setLoading(true);
        try {
            const response = await fetch(route('specialties.with_packages'));
            const data = await response.json();
            setSpecialties(data);
        } catch (error) {
            console.error('Error fetching specialties:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSpecialtyChange = (specialtyId) => {
        const specialty = specialties.find(s => s.id == specialtyId);
        setSelectedSpecialty(specialty);
        setPackages(specialty ? specialty.packages : []);
        setData('package_id', '');
    };

    const handlePackageChange = (packageId) => {
        const pkg = packages.find(p => p.id == packageId);
        setData({
            ...data,
            package_id: packageId,
            billing_day: pkg?.billing_day || '',
            price: pkg?.price || '',
            // Clear end_date to trigger the effect
            end_date: '', 
        });

        if (pkg && data.start_date) {
            calculateEndDate(data.start_date, pkg.duration_months);
        }
    };

    const calculateEndDate = (startDateStr, durationMonths) => {
        if (!startDateStr || !durationMonths) return;
        
        const startDate = new Date(startDateStr + 'T00:00:00');
        const duration = parseInt(durationMonths);
        
        if (!isNaN(startDate.getTime()) && !isNaN(duration)) {
            const endDate = new Date(startDate);
            endDate.setMonth(startDate.getMonth() + duration);
            
            const year = endDate.getFullYear();
            const month = String(endDate.getMonth() + 1).padStart(2, '0');
            const day = String(endDate.getDate()).padStart(2, '0');
            setData(prev => ({ ...prev, end_date: `${year}-${month}-${day}` }));
        }
    };

    useEffect(() => {
        if (data.package_id && data.start_date) {
            const pkg = packages.find(p => p.id == data.package_id);
            if (pkg) {
                calculateEndDate(data.start_date, pkg.duration_months);
            }
        }
    }, [data.start_date, data.package_id]);

    const submit = (e) => {
        e.preventDefault();
        post(route('patients.packages.store', patient.id), {
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    if (!patient) return null;

    return (
        <Modal show={show} onClose={onClose} maxWidth="lg">
            <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-[#466250]">Atribuir Pacote</h2>
                        <p className="text-stone-500">Selecione um pacote para <span className="font-bold text-stone-900">{patient.name}</span></p>
                    </div>
                    <button onClick={onClose} className="p-2 text-stone-400 hover:text-stone-600 transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <form onSubmit={submit} className="space-y-6">
                    {/* Specialty Selection */}
                    <div>
                        <InputLabel htmlFor="specialty_id" value="Especialidade" />
                        <select
                            id="specialty_id"
                            className="mt-1 block w-full border-stone-200 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300 focus:border-primary focus:ring-primary rounded-xl shadow-sm"
                            onChange={(e) => handleSpecialtyChange(e.target.value)}
                            required
                        >
                            <option value="">Selecione uma especialidade</option>
                            {specialties.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Package Selection */}
                    <div>
                        <InputLabel htmlFor="package_id" value="Pacote" />
                        <select
                            id="package_id"
                            className="mt-1 block w-full border-stone-200 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300 focus:border-primary focus:ring-primary rounded-xl shadow-sm"
                            value={data.package_id}
                            onChange={(e) => handlePackageChange(e.target.value)}
                            disabled={!selectedSpecialty}
                            required
                        >
                            <option value="">Selecione um pacote</option>
                            {packages.map(p => (
                                <option key={p.id} value={p.id}>{p.name} ({p.duration_months ? `${p.duration_months} meses` : 'Sessões'})</option>
                            ))}
                        </select>
                        <InputError message={errors.package_id} className="mt-2" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
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
                        <div>
                            <InputLabel htmlFor="end_date" value="Data de Término" />
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

                    <div className="grid grid-cols-2 gap-4">
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
                                required
                            />
                            <InputError message={errors.billing_day} className="mt-2" />
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
                    </div>

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

                    <div className="flex justify-end gap-3 pt-4">
                        <SecondaryButton onClick={onClose} type="button">Cancelar</SecondaryButton>
                        <PrimaryButton disabled={processing}>Atribuir Pacote</PrimaryButton>
                    </div>
                </form>
            </div>
        </Modal>
    );
}
