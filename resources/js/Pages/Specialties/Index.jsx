import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import Modal from '@/Components/Modal';
import DangerButton from '@/Components/DangerButton';
import SecondaryButton from '@/Components/SecondaryButton';

export default function Index({ specialties }) {
    const [confirmingDeletion, setConfirmingDeletion] = useState(false);
    const [specialtyToDelete, setSpecialtyToDelete] = useState(null);

    const confirmDeletion = (specialty) => {
        setSpecialtyToDelete(specialty);
        setConfirmingDeletion(true);
    };

    const closeModal = () => {
        setConfirmingDeletion(false);
    };

    const deleteSpecialty = () => {
        router.delete(route('specialties.destroy', specialtyToDelete.id), {
            onSuccess: () => closeModal(),
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Especialidades" />

            <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-[#466250] mb-2">Especialidades</h1>
                    <p className="text-stone-500">Configure as especialidades dos profissionais da clínica.</p>
                </div>
                <div>
                    <Link 
                        href={route('specialties.create')}
                        className="bg-[#466250] text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-[#384f40] transition-all shadow-lg shadow-primary/10"
                    >
                        <span className="material-symbols-outlined text-xl">add_circle</span>
                        Nova Especialidade
                    </Link>
                </div>
            </section>

            <div className="max-w-3xl bg-white dark:bg-stone-900 rounded-3xl shadow-sm border border-stone-200 dark:border-stone-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-stone-50 dark:bg-stone-800/50 border-b border-stone-100 dark:border-stone-800">
                                <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-widest">Nome da Especialidade</th>
                                <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-widest">Duração</th>
                                <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-widest text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                            {specialties.length === 0 ? (
                                <tr>
                                    <td colSpan="3" className="px-6 py-12 text-center text-stone-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <span className="material-symbols-outlined text-4xl text-stone-300">category</span>
                                            <span>Nenhuma especialidade cadastrada.</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                specialties.map((specialty) => (
                                    <tr key={specialty.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-stone-800 dark:text-stone-200">{specialty.name}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-stone-600 dark:text-stone-400">
                                            {specialty.duration_minutes} min
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Link href={route('specialties.edit', specialty.id)} className="p-2 text-stone-400 hover:text-primary transition-colors">
                                                    <span className="material-symbols-outlined text-sm">edit</span>
                                                </Link>
                                                <button 
                                                    onClick={() => confirmDeletion(specialty)}
                                                    className="p-2 text-stone-400 hover:text-red-500 transition-colors"
                                                >
                                                    <span className="material-symbols-outlined text-sm">delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal show={confirmingDeletion} onClose={closeModal} maxWidth="md">
                <div className="p-8">
                    <div className="flex items-center gap-4 text-red-600 mb-4">
                        <span className="material-symbols-outlined text-4xl">warning</span>
                        <h2 className="text-xl font-bold">Confirmar Exclusão</h2>
                    </div>
                    
                    <p className="text-stone-600 mb-8 leading-relaxed">
                        Tem certeza que deseja excluir a especialidade <span className="font-bold text-stone-900">{specialtyToDelete?.name}</span>? Os profissionais vinculados a ela não serão excluídos, mas perderão este vínculo.
                    </p>

                    <div className="flex justify-end gap-3">
                        <SecondaryButton onClick={closeModal}>Cancelar</SecondaryButton>
                        <DangerButton onClick={deleteSpecialty}>Sim, Excluir</DangerButton>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
