import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function AuthenticatedLayout({ header, children }) {
    const { url } = usePage();
    
    const isDashboard = url === '/dashboard';
    const isAgenda = url === '/agenda';

    return (
        <div className="bg-surface text-on-surface selection:bg-primary-fixed min-h-screen">
            <div className="flex min-h-screen">
                {/* Navigation Drawer (Sidebar) */}
                <aside className="hidden md:flex flex-col w-64 p-4 bg-white dark:bg-stone-900 rounded-r-2xl h-screen shadow-sm space-y-2 sticky top-0 overflow-y-auto">
                    <div className="px-4 py-12 flex justify-center">
                        <Link href="/">
                            <ApplicationLogo className="h-40 w-auto" />
                        </Link>
                    </div>
                    <nav className="flex-1 space-y-1">
                        <Link 
                            href={route('dashboard')} 
                            className={`flex items-center gap-3 px-4 py-3 ease-out duration-200 rounded-lg ${isDashboard ? 'bg-[#466250]/10 text-[#466250] font-bold' : 'text-stone-600 hover:text-[#466250] hover:bg-stone-50 dark:hover:bg-stone-800'}`}
                        >
                            <span className="material-symbols-outlined" style={isDashboard ? { fontVariationSettings: "'FILL' 1" } : {}}>home</span>
                            <span className="font-manrope body-md">Início</span>
                        </Link>
                        <Link 
                            href={route('agenda')} 
                            className={`flex items-center gap-3 px-4 py-3 ease-out duration-200 rounded-lg ${isAgenda ? 'bg-[#466250]/10 text-[#466250] font-bold' : 'text-stone-600 hover:text-[#466250] hover:bg-stone-50 dark:hover:bg-stone-800'}`}
                        >
                            <span className="material-symbols-outlined" style={isAgenda ? { fontVariationSettings: "'FILL' 1" } : {}}>calendar_month</span>
                            <span className="font-manrope body-md">Agenda</span>
                        </Link>
                        <Link 
                            href={route('professionals.index')} 
                            className={`flex items-center gap-3 px-4 py-3 text-stone-600 hover:text-[#466250] hover:bg-stone-50 dark:hover:bg-stone-800 ease-out duration-200 rounded-lg ${route().current('professionals.*') ? 'bg-[#466250]/10 text-[#466250] font-bold' : ''}`}
                        >
                            <span className="material-symbols-outlined">badge</span>
                            <span className="font-manrope body-md">Profissionais</span>
                        </Link>
                        <Link 
                            href={route('specialties.index')} 
                            className={`flex items-center gap-3 px-4 py-3 text-stone-600 hover:text-[#466250] hover:bg-stone-50 dark:hover:bg-stone-800 ease-out duration-200 rounded-lg ${route().current('specialties.*') ? 'bg-[#466250]/10 text-[#466250] font-bold' : ''}`}
                        >
                            <span className="material-symbols-outlined">category</span>
                            <span className="font-manrope body-md">Especialidades</span>
                        </Link>
                        <Link 
                            href={route('patients.index')} 
                            className={`flex items-center gap-3 px-4 py-3 text-stone-600 hover:text-[#466250] hover:bg-stone-50 dark:hover:bg-stone-800 ease-out duration-200 rounded-lg ${route().current('patients.*') ? 'bg-[#466250]/10 text-[#466250] font-bold' : ''}`}
                        >
                            <span className="material-symbols-outlined">groups</span>
                            <span className="font-manrope body-md">Pacientes</span>
                        </Link>
                        <a href="#" className="flex items-center gap-3 px-4 py-3 text-stone-600 hover:text-[#466250] hover:bg-stone-50 dark:hover:bg-stone-800 ease-out duration-200 rounded-lg">
                            <span className="material-symbols-outlined">payments</span>
                            <span className="font-manrope body-md">Financeiro</span>
                        </a>
                        <div className="space-y-1">
                            <div className="px-4 py-2 text-xs font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">settings</span>
                                Configurações
                            </div>
                            <Link 
                                href={route('settings.agenda')} 
                                className={`flex items-center gap-3 px-8 py-2.5 text-stone-600 hover:text-[#466250] hover:bg-stone-50 dark:hover:bg-stone-800 ease-out duration-200 rounded-lg ${route().current('settings.agenda') ? 'bg-[#466250]/10 text-[#466250] font-bold' : ''}`}
                            >
                                <span className="material-symbols-outlined text-sm" style={route().current('settings.agenda') ? { fontVariationSettings: "'FILL' 1" } : {}}>calendar_month</span>
                                <span className="font-manrope text-sm">Agenda</span>
                            </Link>
                            <Link 
                                href={route('settings.packages')} 
                                className={`flex items-center gap-3 px-8 py-2.5 text-stone-600 hover:text-[#466250] hover:bg-stone-50 dark:hover:bg-stone-800 ease-out duration-200 rounded-lg ${route().current('settings.packages') ? 'bg-[#466250]/10 text-[#466250] font-bold' : ''}`}
                            >
                                <span className="material-symbols-outlined text-sm" style={route().current('settings.packages') ? { fontVariationSettings: "'FILL' 1" } : {}}>inventory_2</span>
                                <span className="font-manrope text-sm">Planos</span>
                            </Link>
                        </div>
                    </nav>
                    <div className="pt-4 border-t border-surface-container-highest space-y-1">
                        <Link 
                            href={route('profile.edit')}
                            className="flex items-center gap-3 px-4 py-2 text-stone-600 hover:text-[#466250] hover:bg-stone-50 rounded-lg ease-out duration-200"
                        >
                            <span className="material-symbols-outlined text-sm">settings</span>
                            <span className="font-manrope text-sm font-medium">Perfil</span>
                        </Link>
                        <Link 
                            href={route('logout')} 
                            method="post" 
                            as="button"
                            className="w-full flex items-center gap-3 px-4 py-2 text-error hover:bg-error/5 rounded-lg ease-out duration-200"
                        >
                            <span className="material-symbols-outlined text-sm">logout</span>
                            <span className="font-manrope text-sm font-medium">Sair</span>
                        </Link>
                    </div>
                    <div className="pt-4 mt-2">
                        <div className="flex items-center gap-3 px-4 py-2">
                            <img alt="Avatar" className="w-10 h-10 rounded-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBWUhqAJ9bdLKlSPNgR_IwDOZsB5IyqPDAB2KEMpzsC59ESu3j0GN_5DYh55qBYhGSfW6SqhpiNPF6k5RWd355bwH-Afa5E1BTy3Qd-0Z4T-V9fVxfxee03wDzQdtY2baq-W45lsFF3HCW2DDD61Vb2QmVxovFLPkFauwh3o4A6rzrYt9VNeXMsil-13JuTob7BlJJLaLP4tSxKOI0BTVOqx54BY4lokWdZJxA-O24QQQIrnaqDqx1rWdx4POsigeaftjrOOxlXvFaq" />
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-on-surface truncate">Dra. Mariana</p>
                                <p className="text-xs text-on-surface-variant">Fisioterapeuta</p>
                            </div>
                        </div>
                    </div>
                </aside>

                <div className="flex-1 flex flex-col min-w-0 overflow-hidden min-h-screen">
                    {/* Top App Bar */}
                    <header className="w-full top-0 px-6 py-4 bg-[#f8faf9] dark:bg-stone-950 flex justify-between items-center z-10 shadow-none sticky">
                        <div className="flex items-center gap-4">
                            <h2 className="font-manrope headline-md tracking-tight text-xl font-bold text-[#466250] dark:text-[#789682]">
                                Serenidade Sistêmica
                            </h2>
                        </div>
                        <div className="flex items-center gap-4">
                            <button className="p-2 text-[#466250] dark:text-[#789682] hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors duration-200 rounded-full">
                                <span className="material-symbols-outlined">notifications</span>
                            </button>
                            <div className="md:hidden w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center overflow-hidden">
                                <img alt="Avatar" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCsVmYXN4xThc0nhAm6jnf2LhOajK5TZxW7McYP8M_HjUKTjYjL5S_HVYaOtTQyJJBq8IUaZAaGeQhnbw9W2xZku7jwR0MPOmc3htGL1_RhZJG_xbruPHfotD0gplKMz9kE-fPr8YIjVQlP3ZS9j3DwgutKP94K1Ht7IVy1IYkPSFRSFpcW_UKE6ui4yoAYmFKzlOTyO_ulHCmJesmJe1unPrQL5-xVnUlFXrVFs3IbStRrK4-W4D719y3aWtmviiEmNcll8NMJl9aW" />
                            </div>
                        </div>
                    </header>

                    {/* Main Content Canvas */}
                    <main className="flex-1 overflow-x-hidden p-6 md:p-10 space-y-12 pb-32 md:pb-12">
                        {children}
                    </main>
                </div>
            </div>

            {/* Bottom Navigation Bar (Mobile) */}
            <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-2 bg-white/80 dark:bg-stone-900/80 backdrop-blur-md shadow-[0_-4px_20px_rgba(25,28,28,0.04)] rounded-t-[2rem]">
                <Link 
                    href={route('dashboard')} 
                    className={`flex flex-col items-center justify-center px-4 py-1 transition-all duration-300 ease-in-out ${isDashboard ? 'text-[#466250] bg-[#466250]/10 rounded-2xl' : 'text-stone-400 active:opacity-80'}`}
                >
                    <span className="material-symbols-outlined" style={isDashboard ? { fontVariationSettings: "'FILL' 1" } : {}}>home</span>
                    <span className="font-manrope text-[11px] font-medium">Início</span>
                </Link>
                <Link 
                    href={route('agenda')} 
                    className={`flex flex-col items-center justify-center px-4 py-1 transition-all duration-300 ease-in-out ${isAgenda ? 'text-[#466250] bg-[#466250]/10 rounded-2xl' : 'text-stone-400 active:opacity-80'}`}
                >
                    <span className="material-symbols-outlined" style={isAgenda ? { fontVariationSettings: "'FILL' 1" } : {}}>calendar_month</span>
                    <span className="font-manrope text-[11px] font-medium">Agenda</span>
                </Link>
                <a href="#" className="flex flex-col items-center justify-center text-stone-400 active:opacity-80 transition-all duration-300 ease-in-out">
                    <span className="material-symbols-outlined">person</span>
                    <span className="font-manrope text-[11px] font-medium">Pacientes</span>
                </a>
                <a href="#" className="flex flex-col items-center justify-center text-stone-400 active:opacity-80 transition-all duration-300 ease-in-out">
                    <span className="material-symbols-outlined">more_horiz</span>
                    <span className="font-manrope text-[11px] font-medium">Mais</span>
                </a>
            </nav>
            {/* Floating Action Button (FAB) - Desktop Only/Mobile contextually for Dashboard */}
            <div className="fixed bottom-24 right-8 md:bottom-8 md:right-8 z-40">
                <button className="w-14 h-14 bg-primary text-on-primary rounded-2xl shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200">
                    <span className="material-symbols-outlined text-3xl">add</span>
                </button>
            </div>
        </div>
    );
}
