import { Link } from '@inertiajs/react';

export default function SettingsLayout({ children, title, subtitle }) {
    return (
        <div className="space-y-8">
            <section>
                <h1 className="text-3xl font-extrabold tracking-tight text-[#466250]">{title}</h1>
                <p className="text-stone-500 text-sm">{subtitle}</p>
            </section>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Internal Navigation */}
                <aside className="w-full md:w-64 space-y-1">
                    <Link
                        href={route('settings.agenda')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                            route().current('settings.agenda')
                                ? 'bg-[#466250] text-white shadow-lg shadow-primary/20'
                                : 'text-stone-600 hover:bg-stone-100'
                        }`}
                    >
                        <span className="material-symbols-outlined">calendar_month</span>
                        Agenda
                    </Link>
                    <Link
                        href={route('settings.packages')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                            route().current('settings.packages')
                                ? 'bg-[#466250] text-white shadow-lg shadow-primary/20'
                                : 'text-stone-600 hover:bg-stone-100'
                        }`}
                    >
                        <span className="material-symbols-outlined">inventory_2</span>
                        Planos
                    </Link>
                    <Link
                        href={route('settings.payment')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                            route().current('settings.payment')
                                ? 'bg-[#466250] text-white shadow-lg shadow-primary/20'
                                : 'text-stone-600 hover:bg-stone-100'
                        }`}
                    >
                        <span className="material-symbols-outlined">payments</span>
                        Pagamentos
                    </Link>
                </aside>

                {/* Content Area */}
                <div className="flex-1">
                    {children}
                </div>
            </div>
        </div>
    );
}
