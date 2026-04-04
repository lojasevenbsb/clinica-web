import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SettingsLayout from '@/Layouts/SettingsLayout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import PackageManagementModal from '@/Components/PackageManagementModal';

export default function Packages({ specialties }) {
    const [managementModalShow, setManagementModalShow] = useState(false);
    const [specialtyForManagement, setSpecialtyForManagement] = useState(null);

    const openManagementModal = (specialty) => {
        setSpecialtyForManagement(specialty);
        setManagementModalShow(true);
    };

    const closeManagementModal = () => {
        setManagementModalShow(false);
        setSpecialtyForManagement(null);
    };

    return (
        <AuthenticatedLayout>
            <Head title="Configurações de Pacotes" />

            <SettingsLayout 
                title="Configurações de Pacotes" 
                subtitle="Gerencie os pacotes de sessões oferecidos por cada especialidade."
            >
                <div className="bg-white dark:bg-stone-900 rounded-3xl shadow-sm border border-stone-200 dark:border-stone-800 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-stone-50 dark:bg-stone-800/50 border-b border-stone-100 dark:border-stone-800">
                                    <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-widest">Especialidade</th>
                                    <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-widest">Pacotes Ativos</th>
                                    <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-widest text-right">Gerenciar</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                                {specialties.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" className="px-6 py-12 text-center text-stone-500">
                                            Nenhuma especialidade cadastrada.
                                        </td>
                                    </tr>
                                ) : (
                                    specialties.map((specialty) => (
                                        <tr key={specialty.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-colors">
                                            <td className="px-6 py-4 font-bold text-stone-800 dark:text-stone-200">
                                                {specialty.name}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-2">
                                                    {specialty.packages.length > 0 ? (
                                                        specialty.packages.map(pkg => (
                                                            <span key={pkg.id} className="text-[10px] px-2 py-0.5 bg-stone-100 dark:bg-stone-800 rounded font-medium text-stone-600">
                                                                {pkg.name}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-xs text-stone-400">Nenhum pacote</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button 
                                                    onClick={() => openManagementModal(specialty)}
                                                    className="bg-[#466250] text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-[#384f40] transition-all text-xs ml-auto"
                                                >
                                                    <span className="material-symbols-outlined text-sm">inventory_2</span>
                                                    Gerenciar
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </SettingsLayout>

            <PackageManagementModal 
                show={managementModalShow} 
                onClose={closeManagementModal} 
                specialty={specialtyForManagement} 
            />
        </AuthenticatedLayout>
    );
}
