import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function Agenda() {
    return (
        <AuthenticatedLayout>
            <Head title="Agenda" />

            <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-primary mb-2">Agenda de Atendimentos</h1>
                    <p className="text-on-surface-variant">Quinta-feira, 02 de Abril</p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex bg-surface-container-low rounded-xl p-1">
                        <button className="px-4 py-2 rounded-lg bg-white shadow-sm text-primary font-semibold text-sm">Individual</button>
                        <button className="px-4 py-2 rounded-lg text-on-surface-variant font-medium text-sm">Semanal</button>
                    </div>
                    <button className="bg-primary text-on-primary px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-primary/10">
                        <span className="material-symbols-outlined text-xl">add</span>
                        Novo Agendamento
                    </button>
                </div>
            </section>

            {/* Professional Filters */}
            <section className="bg-surface-container-lowest p-5 rounded-2xl flex flex-col gap-4">
                <label className="text-xs font-bold text-primary tracking-widest uppercase">Filtrar Profissional</label>
                <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10 cursor-pointer">
                        <img alt="Dr. Carlos" className="w-8 h-8 rounded-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBG3ebIWh_J_XFy82GGlycVaiyU2bC6HB4wgS811hq-Jo0LAd5hPA3nzWDXdiDO4sOiKPBdLyopHEQbdxLDGuiA1GfE0x1VhvII_wwLAI5-sVhFLyMNQC8TAHxEk48EYQfJ4Tswj6BOkmLH0XDJyLPJwByldE1bGyTFBCTLfo21AkOeKf7eVR4LL_7wFTFPihw0Bfe4lw-nkb5qbNn_e3TsskwWwQfNcSpOZ1F-PiOc04Brv7FqYRnx3s5caRVItRY3sW_SRqN9CIfi" />
                        <span className="text-sm font-bold text-primary">Dr. Carlos Mendes</span>
                        <span className="ml-1 material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container-low transition-colors cursor-pointer border border-transparent">
                        <img alt="Dra. Ana" className="w-8 h-8 rounded-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAYyA1_q_FSDpiM8x-sPIl82iMdDjRqOOuuJkrlGzDiMhC7JxVcZUOQFIL78SVvbKTEn_eBhaxWdzqS2vvdj5bk2Mi9TN1rLhmuCsoE3UwJFCi1lamECPcXgvGU0mflyBLiuJNwVlwcnjX8lndjbI2oqeiKexkUQVbX1-Utvg2iIgbEYrIOmeCyl6wrv5jSgtvkb8YsC4jrWNpVUyesgb4ZRBd2El26QpmS8kK_X0eSTlmtgep9rKoiI1ApRTKxYUGV-YaYARQpeFhe" />
                        <span className="text-sm font-medium text-on-surface-variant">Dra. Ana Beatriz</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-container-low transition-colors cursor-pointer border border-transparent">
                        <img alt="Dr. Roberto" className="w-8 h-8 rounded-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBI_XnujlOKQkHX26spJkpvbGr9oucdq2Ok8SDZhAoyIXpaM_dyD74myyyYvb4DkSDQJPZgTBagzkMI0N0W_bmCfmoX4j5Cp-OtP58BrlZcmK5CwL2yLH6Im-oyWV5QcTrmdfcAlnqo5iXsBm6-eF_UnM5sXy8c_ja39VZKNBpiSYSeHqO6Qm2f4Bciwt8OiSxSvVKWpUwFmoRh3kTtg7QCrzgzX_grwDODlOJ3eIuxeN2ndp8JRIq49KRy2_PiO4H6egCU5NSngVTI" />
                        <span className="text-sm font-medium text-on-surface-variant">Dr. Roberto Silva</span>
                    </label>
                </div>
            </section>

            {/* Horizontal Date Selector */}
            <section className="bg-surface-container-lowest rounded-2xl p-2 border border-outline-variant/30">
                <div className="flex items-center justify-between gap-1 overflow-x-auto no-scrollbar py-1">
                    <button className="flex-1 min-w-[70px] flex flex-col items-center py-3 px-2 rounded-xl text-on-surface-variant hover:bg-surface-container transition-colors">
                        <span className="text-[10px] font-bold uppercase tracking-wider mb-1">SEG</span>
                        <span className="text-lg font-extrabold">30</span>
                    </button>
                    <button className="flex-1 min-w-[70px] flex flex-col items-center py-3 px-2 rounded-xl text-on-surface-variant hover:bg-surface-container transition-colors">
                        <span className="text-[10px] font-bold uppercase tracking-wider mb-1">TER</span>
                        <span className="text-lg font-extrabold">31</span>
                    </button>
                    <button className="flex-1 min-w-[70px] flex flex-col items-center py-3 px-2 rounded-xl text-on-surface-variant hover:bg-surface-container transition-colors">
                        <span className="text-[10px] font-bold uppercase tracking-wider mb-1">QUA</span>
                        <span className="text-lg font-extrabold">01</span>
                    </button>
                    <button className="flex-1 min-w-[70px] flex flex-col items-center py-3 px-2 rounded-xl bg-primary text-on-primary shadow-lg shadow-primary/20">
                        <span className="text-[10px] font-bold uppercase tracking-wider mb-1">QUI</span>
                        <span className="text-lg font-extrabold">02</span>
                    </button>
                    <button className="flex-1 min-w-[70px] flex flex-col items-center py-3 px-2 rounded-xl text-on-surface-variant hover:bg-surface-container transition-colors">
                        <span className="text-[10px] font-bold uppercase tracking-wider mb-1">SEX</span>
                        <span className="text-lg font-extrabold">03</span>
                    </button>
                    <button className="flex-1 min-w-[70px] flex flex-col items-center py-3 px-2 rounded-xl text-on-surface-variant hover:bg-surface-container transition-colors opacity-50">
                        <span className="text-[10px] font-bold uppercase tracking-wider mb-1">SÁB</span>
                        <span className="text-lg font-extrabold">04</span>
                    </button>
                    <button className="flex-1 min-w-[70px] flex flex-col items-center py-3 px-2 rounded-xl text-on-surface-variant hover:bg-surface-container transition-colors opacity-50">
                        <span className="text-[10px] font-bold uppercase tracking-wider mb-1">DOM</span>
                        <span className="text-lg font-extrabold">05</span>
                    </button>
                </div>
            </section>

            {/* Grid Agenda Section */}
            <section className="space-y-1">
                <div className="grid grid-cols-[80px_1fr] md:grid-cols-[100px_1fr_1fr_1fr] gap-x-px bg-outline-variant/30 border border-outline-variant/30 rounded-t-2xl overflow-hidden">
                    <div className="bg-surface-container px-4 py-3 flex items-center justify-center">
                        <span className="text-xs font-bold text-outline uppercase tracking-widest">Hora</span>
                    </div>
                    <div className="hidden md:flex bg-surface-container px-4 py-3 items-center justify-center border-l border-outline-variant/30">
                        <span className="text-xs font-bold text-outline uppercase tracking-widest">ALUNO 1</span>
                    </div>
                    <div className="hidden md:flex bg-surface-container px-4 py-3 items-center justify-center border-l border-outline-variant/30">
                        <span className="text-xs font-bold text-outline uppercase tracking-widest">ALUNO 2</span>
                    </div>
                    <div className="hidden md:flex bg-surface-container px-4 py-3 items-center justify-center border-l border-outline-variant/30">
                        <span className="text-xs font-bold text-outline uppercase tracking-widest">ALUNO 3</span>
                    </div>
                    <div className="md:hidden bg-surface-container px-4 py-3 flex items-center justify-center border-l border-outline-variant/30">
                        <span className="text-xs font-bold text-outline uppercase tracking-widest">Atendimentos</span>
                    </div>
                </div>

                {/* 07:00 Row */}
                <div className="grid grid-cols-[80px_1fr] md:grid-cols-[100px_1fr_1fr_1fr] gap-x-px bg-outline-variant/30 border-x border-b border-outline-variant/30">
                    <div className="bg-surface-container-low px-4 py-8 flex flex-col items-center justify-center">
                        <span className="text-lg font-bold text-primary">07:00</span>
                    </div>
                    <div className="bg-white p-2 flex flex-col md:flex-row gap-2">
                        {/* Slot 1 */}
                        <div className="flex-1 bg-primary/5 border border-primary/10 rounded-xl p-3 flex flex-col justify-between min-h-[80px]">
                            <div className="flex items-start justify-between">
                                <h3 className="font-bold text-sm text-on-surface">Fernanda Lima</h3>
                                <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                            </div>
                            <span className="text-[10px] font-bold text-primary uppercase tracking-tighter">Aluno 1</span>
                        </div>
                        {/* Empty Slot 2 (Mobile) */}
                        <div className="md:hidden flex flex-1 bg-surface-container-low/30 border border-dashed border-outline-variant/50 rounded-xl items-center justify-center py-4">
                            <span className="material-symbols-outlined text-outline/30">add</span>
                        </div>
                    </div>
                    <div className="hidden md:block bg-white p-2">
                        <div className="h-full bg-surface-container-low/30 border border-dashed border-outline-variant/50 rounded-xl flex items-center justify-center group cursor-pointer hover:bg-surface-container-low transition-colors">
                            <span className="material-symbols-outlined text-outline/30 group-hover:text-primary transition-colors">add</span>
                        </div>
                    </div>
                    <div className="hidden md:block bg-white p-2">
                        <div className="h-full bg-surface-container-low/30 border border-dashed border-outline-variant/50 rounded-xl flex items-center justify-center group cursor-pointer hover:bg-surface-container-low transition-colors">
                            <span className="material-symbols-outlined text-outline/30 group-hover:text-primary transition-colors">add</span>
                        </div>
                    </div>
                </div>

                {/* 08:00 Row */}
                <div className="grid grid-cols-[80px_1fr] md:grid-cols-[100px_1fr_1fr_1fr] gap-x-px bg-outline-variant/30 border-x border-b border-outline-variant/30">
                    <div className="bg-surface-container-low px-4 py-8 flex flex-col items-center justify-center">
                        <span className="text-lg font-bold text-primary">08:00</span>
                    </div>
                    <div className="bg-white p-2 flex flex-col md:flex-row gap-2 col-span-1 md:col-span-3 md:grid md:grid-cols-3">
                        <div className="bg-primary/5 border border-primary/20 border-l-4 border-l-primary rounded-xl p-3 flex flex-col justify-between min-h-[90px] shadow-sm">
                            <div>
                                <div className="flex items-start justify-between mb-1">
                                    <h3 className="font-bold text-sm text-on-surface">Mariana Oliveira</h3>
                                    <span className="material-symbols-outlined text-primary text-xs">alarm</span>
                                </div>
                                <span className="text-[10px] text-on-surface-variant bg-primary-fixed text-on-primary-fixed-variant px-2 py-0.5 rounded-full font-bold">Aluno 1</span>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                                <span className="text-[10px] text-outline flex items-center gap-0.5">Pilates Solo</span>
                                <span className="text-[10px] font-bold text-primary">Confirmado</span>
                            </div>
                        </div>
                        <div className="bg-primary/5 border border-primary/20 border-l-4 border-l-primary rounded-xl p-3 flex flex-col justify-between min-h-[90px] shadow-sm">
                            <div>
                                <div className="flex items-start justify-between mb-1">
                                    <h3 className="font-bold text-sm text-on-surface">Pedro Santos</h3>
                                    <span className="material-symbols-outlined text-primary text-xs">alarm</span>
                                </div>
                                <span className="text-[10px] text-on-surface-variant bg-primary-fixed text-on-primary-fixed-variant px-2 py-0.5 rounded-full font-bold">Aluno 2</span>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                                <span className="text-[10px] text-outline flex items-center gap-0.5">Aparelhos</span>
                                <span className="text-[10px] font-bold text-primary">Confirmado</span>
                            </div>
                        </div>
                        <div className="hidden md:flex bg-surface-container-low/30 border border-dashed border-outline-variant/50 rounded-xl items-center justify-center group cursor-pointer hover:bg-surface-container-low transition-colors">
                            <span className="material-symbols-outlined text-outline/30 group-hover:text-primary transition-colors">add</span>
                        </div>
                    </div>
                </div>

                {/* 09:00 Row */}
                <div className="grid grid-cols-[80px_1fr] md:grid-cols-[100px_1fr_1fr_1fr] gap-x-px bg-outline-variant/30 border-x border-b border-outline-variant/30">
                    <div className="bg-surface-container-low px-4 py-8 flex flex-col items-center justify-center">
                        <span className="text-lg font-bold text-secondary">09:00</span>
                    </div>
                    <div className="bg-white p-2 flex flex-col md:flex-row gap-2 col-span-1 md:col-span-3 md:grid md:grid-cols-3">
                        <div className="bg-secondary/5 border border-secondary/20 border-l-4 border-l-secondary rounded-xl p-3 flex flex-col justify-between min-h-[90px] shadow-sm">
                            <div>
                                <div className="flex items-start justify-between mb-1">
                                    <h3 className="font-bold text-sm text-on-surface">Ricardo Alves</h3>
                                    <span className="material-symbols-outlined text-secondary text-xs">pending</span>
                                </div>
                                <span className="text-[10px] text-on-surface-variant bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded-full font-bold">Aluno 1</span>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                                <span className="text-[10px] text-outline flex items-center gap-0.5">Avaliação</span>
                                <span className="text-[10px] font-bold text-secondary">Pendente</span>
                            </div>
                        </div>
                        <div className="hidden md:flex bg-surface-container-low/30 border border-dashed border-outline-variant/50 rounded-xl items-center justify-center group cursor-pointer hover:bg-surface-container-low transition-colors">
                            <span className="material-symbols-outlined text-outline/30 group-hover:text-primary transition-colors">add</span>
                        </div>
                        <div className="hidden md:flex bg-surface-container-low/30 border border-dashed border-outline-variant/50 rounded-xl items-center justify-center group cursor-pointer hover:bg-surface-container-low transition-colors">
                            <span className="material-symbols-outlined text-outline/30 group-hover:text-primary transition-colors">add</span>
                        </div>
                    </div>
                </div>

                {/* 10:00 Row */}
                <div className="grid grid-cols-[80px_1fr] md:grid-cols-[100px_1fr_1fr_1fr] gap-x-px bg-outline-variant/30 border-x border-b border-outline-variant/30 rounded-b-2xl overflow-hidden">
                    <div className="bg-surface-container-low px-4 py-8 flex flex-col items-center justify-center">
                        <span className="text-lg font-bold text-outline">10:00</span>
                    </div>
                    <div className="bg-white p-2 flex flex-col md:flex-row gap-2 col-span-1 md:col-span-3 md:grid md:grid-cols-3">
                        <div className="bg-error/5 border border-error/20 border-l-4 border-l-error/40 rounded-xl p-3 flex flex-col justify-between min-h-[90px] opacity-60">
                            <div>
                                <div className="flex items-start justify-between mb-1">
                                    <h3 className="font-bold text-sm text-outline line-through">Helena Santos</h3>
                                    <span className="material-symbols-outlined text-error text-xs">cancel</span>
                                </div>
                                <span className="text-[10px] text-outline bg-surface-container-high px-2 py-0.5 rounded-full font-bold">Aluno 1</span>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                                <span className="text-[10px] font-bold text-error">Cancelado</span>
                            </div>
                        </div>
                        <div className="hidden md:flex bg-surface-container-low/30 border border-dashed border-outline-variant/50 rounded-xl items-center justify-center group cursor-pointer hover:bg-surface-container-low transition-colors">
                            <span className="material-symbols-outlined text-outline/30 group-hover:text-primary transition-colors">add</span>
                        </div>
                        <div className="hidden md:flex bg-surface-container-low/30 border border-dashed border-outline-variant/50 rounded-xl items-center justify-center group cursor-pointer hover:bg-surface-container-low transition-colors">
                            <span className="material-symbols-outlined text-outline/30 group-hover:text-primary transition-colors">add</span>
                        </div>
                    </div>
                </div>
            </section>
        </AuthenticatedLayout>
    );
}
