import PrimaryButton from '@/Components/PrimaryButton';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function VerifyEmail({ status }) {
    const { post, processing } = useForm({});

    const submit = (e) => {
        e.preventDefault();

        post(route('verification.send'));
    };

    return (
        <GuestLayout>
            <Head title="Verificação de E-mail" />

            <div className="mb-8 text-center md:text-left">
                <h2 className="text-3xl font-extrabold text-on-surface mb-2 font-manrope tracking-tight">Verifique seu e-mail</h2>
                <p className="text-on-surface-variant text-sm font-medium leading-relaxed">
                    Obrigado por se cadastrar! Antes de começar, você poderia verificar seu endereço de e-mail clicando no link que acabamos de enviar?
                </p>
            </div>

            <div className="mb-4 text-sm text-on-surface-variant">
                Se você não recebeu o e-mail, teremos o prazer de enviar outro para você.
            </div>

            {status === 'verification-link-sent' && (
                <div className="mb-6 rounded-lg bg-primary-fixed p-4 text-sm font-medium text-on-primary-fixed-variant shadow-sm">
                    Um novo link de verificação foi enviado para o endereço de e-mail fornecido durante o registro.
                </div>
            )}

            <form onSubmit={submit}>
                <div className="mt-4 flex items-center justify-between">
                    <PrimaryButton disabled={processing}>
                        Reenviar e-mail de verificação
                    </PrimaryButton>

                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="rounded-md text-sm text-on-surface-variant underline hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    >
                        Sair
                    </Link>
                </div>
            </form>
        </GuestLayout>
    );
}
