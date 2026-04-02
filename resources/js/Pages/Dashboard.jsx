import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

export default function Dashboard() {
    return (
        <AuthenticatedLayout>
            <Head title="Início" />

            {/* Hero Greeting & Quick Actions */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-end mb-12">
                <div className="lg:col-span-2">
                    <h3 className="text-4xl font-extrabold tracking-tight text-on-surface mb-2">Bom dia, Dra. Mariana.</h3>
                    <p className="text-on-surface-variant text-lg">Sua clínica está em harmonia hoje. Você tem 12 sessões agendadas.</p>
                </div>
                <div className="flex flex-wrap gap-4 lg:justify-end">
                    <button className="flex items-center gap-2 px-6 py-3 bg-primary text-on-primary font-semibold rounded-xl shadow-[0_12px_32px_rgba(70,98,80,0.15)] hover:bg-primary-container transition-all duration-200">
                        <span className="material-symbols-outlined">add_circle</span>
                        <span>Nova Consulta</span>
                    </button>
                    <button className="flex items-center gap-2 px-6 py-3 bg-surface-container-lowest text-primary border border-outline-variant/15 font-semibold rounded-xl hover:bg-surface-container-low transition-all duration-200">
                        <span className="material-symbols-outlined">person_add</span>
                        <span>Novo Paciente</span>
                    </button>
                </div>
            </section>

            {/* Bento Grid Layout */}
            <section className="grid grid-cols-1 md:grid-cols-6 grid-rows-auto gap-6">
                {/* Appointment Card - Large */}
                <div className="md:col-span-4 bg-surface-container-lowest rounded-3xl p-8 shadow-sm">
                    <div className="flex justify-between items-center mb-8">
                        <h4 className="text-xl font-bold text-on-surface">Próximos Agendamentos</h4>
                        <Link className="text-primary font-semibold text-sm hover:underline" href={route('agenda')}>Ver agenda completa</Link>
                    </div>
                    <div className="space-y-6">
                        {/* Appointment Item 1 */}
                        <div className="flex items-center gap-6 p-4 rounded-2xl hover:bg-surface-container-low transition-colors duration-200 relative overflow-hidden">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-full"></div>
                            <div className="text-center min-w-[60px]">
                                <p className="text-2xl font-bold text-on-surface">09:00</p>
                                <p className="text-xs text-on-surface-variant font-medium uppercase tracking-wider">Pilates</p>
                            </div>
                            <div className="flex-1">
                                <p className="text-lg font-bold text-on-surface">Ana Paula Rodrigues</p>
                                <p className="text-sm text-on-surface-variant">Sessão 05 de 12 • Reabilitação Postural</p>
                            </div>
                            <div className="flex gap-2">
                                <span className="px-4 py-1.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant text-xs font-bold">Confirmado</span>
                                <button className="p-2 text-stone-400 hover:text-primary transition-colors">
                                    <span className="material-symbols-outlined">more_vert</span>
                                </button>
                            </div>
                        </div>

                        {/* Appointment Item 2 */}
                        <div className="flex items-center gap-6 p-4 rounded-2xl hover:bg-surface-container-low transition-colors duration-200 relative overflow-hidden">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary rounded-full"></div>
                            <div className="text-center min-w-[60px]">
                                <p className="text-2xl font-bold text-on-surface">10:30</p>
                                <p className="text-xs text-on-surface-variant font-medium uppercase tracking-wider">Fisio</p>
                            </div>
                            <div className="flex-1">
                                <p className="text-lg font-bold text-on-surface">Carlos Eduardo Lima</p>
                                <p className="text-sm text-on-surface-variant">Avaliação Inicial • Lesão em LCA</p>
                            </div>
                            <div className="flex gap-2">
                                <span className="px-4 py-1.5 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold">Em Aberto</span>
                                <button className="p-2 text-stone-400 hover:text-primary transition-colors">
                                    <span className="material-symbols-outlined">more_vert</span>
                                </button>
                            </div>
                        </div>

                        {/* Appointment Item 3 */}
                        <div className="flex items-center gap-6 p-4 rounded-2xl hover:bg-surface-container-low transition-colors duration-200 relative overflow-hidden">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-full"></div>
                            <div className="text-center min-w-[60px]">
                                <p className="text-2xl font-bold text-on-surface">11:30</p>
                                <p className="text-xs text-on-surface-variant font-medium uppercase tracking-wider">Pilates</p>
                            </div>
                            <div className="flex-1">
                                <p className="text-lg font-bold text-on-surface">Beatriz Silveira</p>
                                <p className="text-sm text-on-surface-variant">Sessão 02 de 10 • Gestante</p>
                            </div>
                            <div className="flex gap-2">
                                <span className="px-4 py-1.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant text-xs font-bold">Confirmado</span>
                                <button className="p-2 text-stone-400 hover:text-primary transition-colors">
                                    <span className="material-symbols-outlined">more_vert</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Status Clinic - Medium */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-primary text-on-primary rounded-3xl p-8 shadow-sm h-full flex flex-col justify-between overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-8 opacity-20 transform translate-x-4 -translate-y-4">
                            <span className="material-symbols-outlined text-[120px]">spa</span>
                        </div>
                        <div className="relative z-10">
                            <h4 className="text-lg font-semibold opacity-90 mb-4">Ocupação da Clínica</h4>
                            <div className="text-5xl font-bold mb-2">84%</div>
                            <p className="text-sm opacity-80">Capacidade produtiva otimizada para o período matutino.</p>
                        </div>
                        <div className="mt-8 relative z-10">
                            <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                                <div className="bg-white h-full w-[84%] rounded-full"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Finance Summary - Small */}
                <div className="md:col-span-2 bg-secondary-container text-on-secondary-container rounded-3xl p-8 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <span className="material-symbols-outlined text-4xl">payments</span>
                        <span className="px-2 py-1 bg-white/40 rounded-lg text-xs font-bold">+12%</span>
                    </div>
                    <h4 className="text-sm font-bold uppercase tracking-wider opacity-70">Faturamento Mensal</h4>
                    <p className="text-3xl font-extrabold mt-1">R$ 24.850</p>
                    <p className="text-xs mt-4 font-medium">Previsão de R$ 32k até dia 30.</p>
                </div>

                {/* Patients Summary - Small */}
                <div className="md:col-span-2 bg-surface-container-high rounded-3xl p-8 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <span className="material-symbols-outlined text-4xl text-primary">groups</span>
                        <span className="text-primary font-bold text-xs">8 novos</span>
                    </div>
                    <h4 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant">Total de Pacientes</h4>
                    <p className="text-3xl font-extrabold text-on-surface mt-1">142</p>
                    <p className="text-xs mt-4 text-on-surface-variant font-medium">Crescimento constante este mês.</p>
                </div>

                {/* Tips/Wellness - Small */}
                <div className="md:col-span-2 bg-surface-container-lowest rounded-3xl p-8 shadow-sm border border-outline-variant/15">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
                        <h4 className="font-bold text-on-surface">Dica do Dia</h4>
                    </div>
                    <p className="text-sm text-on-surface-variant italic leading-relaxed">
                        "O movimento é uma medicina para criar mudança nos estados físicos, emocionais e mentais."
                    </p>
                    <p className="text-xs text-primary font-bold mt-4">— Joseph Pilates</p>
                </div>
            </section>
        </AuthenticatedLayout>
    );
}
