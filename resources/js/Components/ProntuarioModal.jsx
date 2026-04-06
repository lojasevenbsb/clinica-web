import Modal from '@/Components/Modal';
import SecondaryButton from '@/Components/SecondaryButton';

export default function ProntuarioModal({ show, onClose, patient }) {
    return (
        <Modal show={show} onClose={onClose} maxWidth="2xl">
            <div className="flex flex-col h-full max-h-[80vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-5 border-b border-stone-100">
                    <div className="flex items-center gap-3">
                        <div className="bg-emerald-50 p-2.5 rounded-xl">
                            <span className="material-symbols-outlined text-emerald-600 text-2xl">folder_shared</span>
                        </div>
                        <div>
                            <h2 className="text-lg font-extrabold text-stone-800">Prontuário</h2>
                            <p className="text-sm text-stone-400">{patient?.name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-stone-100 text-stone-400 transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto flex-1 px-8 py-6">
                    <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                        <span className="material-symbols-outlined text-5xl text-stone-200">folder_shared</span>
                        <p className="text-stone-400 text-sm">Nenhum registro no prontuário deste paciente.</p>
                        <button
                            type="button"
                            className="mt-2 bg-[#466250] text-white px-5 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-[#384f40] transition-all"
                        >
                            <span className="material-symbols-outlined text-base">add</span>
                            Novo Registro
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end px-8 py-4 border-t border-stone-100">
                    <SecondaryButton onClick={onClose}>Fechar</SecondaryButton>
                </div>
            </div>
        </Modal>
    );
}
