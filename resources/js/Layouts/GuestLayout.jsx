import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    return (
        <div className="flex min-h-screen bg-surface md:flex-row flex-col font-manrope">
            {/* Left side - Banner / Image */}
            <div className="md:w-1/2 w-full bg-primary relative hidden md:block overflow-hidden">
                <img 
                    src="https://images.unsplash.com/photo-1498837167922-c77900222a2b?q=80&w=1470&auto=format&fit=crop" 
                    alt="Serenidade Clínica" 
                    className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary-fixed to-transparent opacity-80"></div>
                <div className="relative z-10 flex flex-col h-full justify-between p-12">
                    <Link href="/">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-4xl text-on-primary">spa</span>
                            <span className="text-2xl font-bold tracking-tight text-on-primary">Serenidade Sistêmica</span>
                        </div>
                    </Link>
                    <div className="mt-auto">
                        <h1 className="text-5xl font-extrabold text-on-primary mb-6 leading-tight">
                            Elevando a sua prática <br/> para o próximo nível.
                        </h1>
                        <p className="text-lg text-primary-fixed max-w-md">
                            Gerencie seus pacientes, agendamentos e acompanhamentos com inteligência e elegância.
                        </p>
                    </div>
                </div>
            </div>

            {/* Right side - Form container */}
            <div className="flex-1 flex flex-col items-center justify-center bg-surface-container-lowest p-6 sm:p-12">
                {/* Mobile top logo */}
                <div className="md:hidden flex items-center justify-center gap-2 mb-8 w-full">
                     <span className="material-symbols-outlined text-3xl text-primary">spa</span>
                     <span className="text-xl font-bold text-on-surface">Serenidade</span>
                </div>
                
                <div className="w-full max-w-md">
                    {children}
                </div>
            </div>
        </div>
    );
}
