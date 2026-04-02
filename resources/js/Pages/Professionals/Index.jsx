import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import Modal from '@/Components/Modal';
import DangerButton from '@/Components/DangerButton';
import SecondaryButton from '@/Components/SecondaryButton';

export default function Index({ professionals }) {
    const [confirmingDeletion, setConfirmingDeletion] = useState(false);
    const [professionalToDelete, setProfessionalToDelete] = useState(null);

    const confirmDeletion = (professional) => {
        setProfessionalToDelete(professional);
        setConfirmingDeletion(true);
    };

    const closeModal = () => {
        setConfirmingDeletion(false);
    };

    const deleteProfessional = () => {
        router.delete(route('professionals.destroy', professionalToDelete.id), {
            onSuccess: () => closeModal(),
            onFinish: () => resetDeletionState(),
        });
    };

    const resetDeletionState = () => {
        setProfessionalToDelete(null);
    };
    return (
        <AuthenticatedLayout>
            <Head title="Profissionais" />

            <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-primary mb-2">Profissionais</h1>
                    <p className="text-on-surface-variant">Gerencie a equipe da sua clínica.</p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                    <Link 
                        href={route('professionals.create')}
                        className="bg-primary text-on-primary px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-primary/10"
                    >
                        <span className="material-symbols-outlined text-xl">person_add</span>
                        Novo Profissional
                    </Link>
                </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {professionals.length === 0 ? (
                    <div className="col-span-full bg-surface-container-lowest rounded-3xl p-12 text-center border border-dashed border-outline-variant">
                        <span className="material-symbols-outlined text-6xl text-outline-variant mb-4">person_off</span>
                        <p className="text-on-surface-variant text-lg">Nenhum profissional cadastrado ainda.</p>
                        <Link href={route('professionals.create')} className="text-primary font-bold mt-4 inline-block hover:underline">
                            Cadastrar o primeiro profissional
                        </Link>
                    </div>
                ) : (
                    professionals.map((professional) => (
                        <div key={professional.id} className="bg-surface-container-lowest rounded-3xl p-6 shadow-sm border border-outline-variant/30 hover:border-primary/30 transition-all group">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <div 
                                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl"
                                        style={{ backgroundColor: professional.color }}
                                    >
                                        {professional.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-on-surface text-lg group-hover:text-primary transition-colors">{professional.name}</h3>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {professional.specialties.map((s) => (
                                                <span key={s.id} className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                                    {s.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <Link href={route('professionals.edit', professional.id)} className="p-2 text-stone-400 hover:text-primary transition-colors">
                                        <span className="material-symbols-outlined text-sm">edit</span>
                                    </Link>
                                    <button 
                                        type="button" 
                                        onClick={() => confirmDeletion(professional)}
                                        className="p-2 text-stone-400 hover:text-red-500 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-sm">delete</span>
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-2 pt-4 border-t border-outline-variant/10">
                                {professional.registration_number && (
                                    <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                                        <span className="material-symbols-outlined text-sm">badge</span>
                                        <span>{professional.registration_number}</span>
                                    </div>
                                )}
                                {professional.email && (
                                    <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                                        <span className="material-symbols-outlined text-sm">mail</span>
                                        <span>{professional.email}</span>
                                    </div>
                                )}
                                {professional.phone && (
                                    <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                                        <span className="material-symbols-outlined text-sm">call</span>
                                        <span>{professional.phone}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <Modal show={confirmingDeletion} onClose={closeModal} maxWidth="md">
                <div className="p-8">
                    <div className="flex items-center gap-4 text-red-600 mb-4">
                        <span className="material-symbols-outlined text-4xl">warning</span>
                        <h2 className="text-xl font-bold">Confirmar Exclusão</h2>
                    </div>
                    
                    <p className="text-stone-600 mb-8 leading-relaxed">
                        Tem certeza que deseja excluir o(a) profissional <span className="font-bold text-stone-900 font-manrope">{professionalToDelete?.name}</span>? Esta ação é permanente e não poderá ser desfeita.
                    </p>

                    <div className="flex justify-end gap-3">
                        <SecondaryButton 
                            onClick={closeModal}
                            className="bg-transparent border-stone-200 hover:bg-stone-50"
                        >
                            Cancelar
                        </SecondaryButton>
                        <DangerButton onClick={deleteProfessional} className="px-6 py-2.5 bg-red-600 hover:bg-red-700">
                            Sim, Excluir Registro
                        </DangerButton>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
