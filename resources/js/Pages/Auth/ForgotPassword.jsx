import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('password.email'));
    };

    return (
        <GuestLayout>
            <Head title="Esqueci minha senha" />

            <div className="mb-8 text-center md:text-left">
                <h2 className="text-3xl font-extrabold text-on-surface mb-2 font-manrope tracking-tight">Recuperar acesso</h2>
                <p className="text-on-surface-variant text-sm font-medium leading-relaxed">
                    Esqueceu sua senha? Sem problemas. Informe seu e-mail e enviaremos um link de redefinição para você.
                </p>
            </div>

            {status && (
                <div className="mb-6 rounded-lg bg-primary-fixed p-4 text-sm font-medium text-on-primary-fixed-variant shadow-sm">
                    {status}
                </div>
            )}

            <form onSubmit={submit}>
                <TextInput
                    id="email"
                    type="email"
                    name="email"
                    value={data.email}
                    className="mt-1 block w-full"
                    isFocused={true}
                    onChange={(e) => setData('email', e.target.value)}
                />

                <InputError message={errors.email} className="mt-2" />

                <div className="mt-4 flex items-center justify-end">
                    <PrimaryButton className="w-full" disabled={processing}>
                        Enviar link de redefinição
                    </PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    );
}
