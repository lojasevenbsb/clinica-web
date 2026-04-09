import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import Modal from '@/Components/Modal';
import DangerButton from '@/Components/DangerButton';
import SecondaryButton from '@/Components/SecondaryButton';
import AssignPackageModal from '@/Components/AssignPackageModal';
import PatientPlansModal from '@/Components/PatientPlansModal';
import AnamneseModal from '@/Components/AnamneseModal';
import ProntuarioModal from '@/Components/ProntuarioModal';
import EvolucaoModal from '@/Components/EvolucaoModal';
import PatientAppointmentsModal from '@/Components/PatientAppointmentsModal';
import AppointmentModal from '@/Components/AppointmentModal';

export default function Index({ patients, filters, professionals, specialties, packages }) {
    const [search, setSearch] = useState(filters.search || '');
    const [confirmingDeletion, setConfirmingDeletion] = useState(false);
    const [patientToDelete, setPatientToDelete] = useState(null);
    const [activePatient, setActivePatient] = useState(null);
    const [modal, setModal] = useState(null); // 'plans' | 'assign' | 'anamnese' | 'prontuario' | 'evolucao' | 'appointments' | 'new_appointment' | null
    const [appointmentPatientId, setAppointmentPatientId] = useState(null);

    const openPlans = (patient) => {
        setActivePatient(patient);
        setModal('plans');
    };

    const openAssignPackage = (patient) => {
        setActivePatient(patient);
        setModal('assign');
    };

    const openAnamnese = (patient) => {
        setActivePatient(patient);
        setModal('anamnese');
    };

    const openProntuario = (patient) => {
        setActivePatient(patient);
        setModal('prontuario');
    };

    const openEvolucao = (patient) => {
        setActivePatient(patient);
        setModal('evolucao');
    };

    const openAppointments = (patient) => {
        setActivePatient(patient);
        setModal('appointments');
    };

    const closeModal_ = () => {
        setModal(null);
        setActivePatient(null);
    };

    const confirmDeletion = (patient) => {
        setPatientToDelete(patient);
        setConfirmingDeletion(true);
    };

    const closeModal = () => {
        setConfirmingDeletion(false);
    };

    const deletePatient = () => {
        router.delete(route('patients.destroy', patientToDelete.id), {
            onSuccess: () => closeModal(),
            onFinish: () => resetDeletionState(),
        });
    };

    const resetDeletionState = () => {
        setPatientToDelete(null);
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (search !== (filters.search || '')) {
                router.get(route('patients.index'), { search }, {
                    preserveState: true,
                    replace: true
                });
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [search]);

    return (
        <AuthenticatedLayout>
            <Head title="Cadastros" />

            <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-[#466250] mb-2">Cadastros</h1>
                    <p className="text-stone-500">Gerencie o cadastro de pacientes e alunos da clínica.</p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">search</span>
                        <input
                            type="text"
                            placeholder="Buscar por nome ou CPF..."
                            className="pl-10 pr-4 py-2.5 bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 rounded-xl text-sm focus:ring-primary focus:border-primary w-full md:w-64 transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Link
                        href={route('patients.create')}
                        className="bg-[#466250] text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-[#384f40] transition-all shadow-lg shadow-primary/10"
                    >
                        <span className="material-symbols-outlined text-xl">person_add</span>
                        Novo Cadastro
                    </Link>
                </div>
            </section>

            <div className="bg-white dark:bg-stone-900 rounded-3xl shadow-sm border border-stone-200 dark:border-stone-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-stone-50 dark:bg-stone-800/50 border-b border-stone-100 dark:border-stone-800">
                                <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-widest">Nome</th>
                                <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-widest">CPF</th>
                                <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-widest">Contato</th>
                                <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-widest">Nascimento</th>
                                <th className="px-6 py-4 text-xs font-bold text-stone-400 uppercase tracking-widest text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                            {patients.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-stone-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <span className="material-symbols-outlined text-4xl text-stone-300">person_off</span>
                                            <span>Nenhum cadastro encontrado.</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                patients.map((patient) => (
                                    <tr key={patient.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-stone-800 dark:text-stone-200">{patient.name}</div>
                                            {patient.email && <div className="text-xs text-stone-400">{patient.email}</div>}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-stone-600 dark:text-stone-400">{patient.cpf}</td>
                                        <td className="px-6 py-4 text-sm text-stone-600 dark:text-stone-400">{patient.phone}</td>
                                        <td className="px-6 py-4 text-sm text-stone-600 dark:text-stone-400">
                                            {new Date(patient.birth_date).toLocaleDateString('pt-BR')}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => openAnamnese(patient)}
                                                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Ficha de Anamnese"
                                                >
                                                    <span className="material-symbols-outlined text-sm">assignment</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => openProntuario(patient)}
                                                    className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                    title="Prontuário"
                                                >
                                                    <span className="material-symbols-outlined text-sm">folder_shared</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => openEvolucao(patient)}
                                                    className="p-2 text-purple-500 hover:bg-purple-50 rounded-lg transition-colors"
                                                    title="Evolução do Paciente"
                                                >
                                                    <span className="material-symbols-outlined text-sm">trending_up</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => openAppointments(patient)}
                                                    className="p-2 text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                                                    title="Ver Agendamentos"
                                                >
                                                    <span className="material-symbols-outlined text-sm">calendar_month</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => openPlans(patient)}
                                                    className="p-2 text-[#466250] hover:bg-[#466250]/10 rounded-lg transition-colors"
                                                    title="Ver Planos"
                                                >
                                                    <span className="material-symbols-outlined text-sm">inventory_2</span>
                                                </button>
                                                <Link
                                                    href={route('pilates.matriculas.index', { new_patient_id: patient.id })}
                                                    className="p-2 text-[#466250] hover:bg-[#466250]/10 rounded-lg transition-colors"
                                                    title="Matricular no Pilates"
                                                >
                                                    <span className="material-symbols-outlined text-sm">self_improvement</span>
                                                </Link>
                                                <Link href={route('patients.edit', patient.id)} className="p-2 text-stone-400 hover:text-primary transition-colors rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800">
                                                    <span className="material-symbols-outlined text-sm">edit</span>
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() => confirmDeletion(patient)}
                                                    className="p-2 text-stone-400 hover:text-red-500 transition-colors rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800"
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
                        Tem certeza que deseja excluir o cadastro de <span className="font-bold text-stone-900 font-manrope">{patientToDelete?.name}</span>? Esta ação é permanente e não poderá ser desfeita.
                    </p>

                    <div className="flex justify-end gap-3">
                        <SecondaryButton 
                            onClick={closeModal}
                            className="bg-transparent border-stone-200 hover:bg-stone-50"
                        >
                            Cancelar
                        </SecondaryButton>
                        <DangerButton onClick={deletePatient} className="px-6 py-2.5 bg-red-600 hover:bg-red-700">
                            Sim, Excluir Registro
                        </DangerButton>
                    </div>
                </div>
            </Modal>

            <PatientPlansModal
                show={modal === 'plans'}
                onClose={closeModal_}
                patient={activePatient}
                onAssignNew={(patient) => {
                    setActivePatient(patient);
                    setModal('assign');
                }}
            />

            <AssignPackageModal
                show={modal === 'assign'}
                onClose={closeModal_}
                patient={activePatient}
            />

            <AnamneseModal
                show={modal === 'anamnese'}
                onClose={closeModal_}
                patient={activePatient}
            />

            <ProntuarioModal
                show={modal === 'prontuario'}
                onClose={closeModal_}
                patient={activePatient}
            />

            <EvolucaoModal
                show={modal === 'evolucao'}
                onClose={closeModal_}
                patient={activePatient}
            />

            <PatientAppointmentsModal
                show={modal === 'appointments'}
                onClose={closeModal_}
                patient={activePatient}
                onSchedule={(patient) => {
                    setAppointmentPatientId(patient?.id ?? null);
                    setModal('new_appointment');
                }}
            />

            <AppointmentModal
                show={modal === 'new_appointment'}
                onClose={closeModal_}
                professionals={professionals}
                patients={patients}
                specialties={specialties}
                packages={packages}
                appointments={[]}
                professionalHours={[]}
                selectedDate={new Date().toISOString().slice(0, 10)}
                selectedProfessionalId={null}
                preselectedPatientId={appointmentPatientId}
            />
        </AuthenticatedLayout>
    );
}
