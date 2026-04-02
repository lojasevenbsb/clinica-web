import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

export default function Index({ professionals }) {
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
                                        <p className="text-sm text-on-surface-variant">{professional.specialty}</p>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <Link href={route('professionals.edit', professional.id)} className="p-2 text-stone-400 hover:text-primary transition-colors">
                                        <span className="material-symbols-outlined text-sm">edit</span>
                                    </Link>
                                    <button className="p-2 text-stone-400 hover:text-error transition-colors">
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
        </AuthenticatedLayout>
    );
}
