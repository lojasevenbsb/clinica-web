import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit({ mustVerifyEmail, status }) {
    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-2xl font-bold leading-tight text-on-surface font-manrope">
                    Perfil
                </h2>
            }
        >
            <Head title="Perfil" />

            <div className="space-y-8">
                <div className="bg-surface-container-lowest p-6 shadow-sm rounded-3xl sm:p-10 border border-outline-variant/10">
                    <UpdateProfileInformationForm
                        mustVerifyEmail={mustVerifyEmail}
                        status={status}
                        className="max-w-xl"
                    />
                </div>

                <div className="bg-surface-container-lowest p-6 shadow-sm rounded-3xl sm:p-10 border border-outline-variant/10">
                    <UpdatePasswordForm className="max-w-xl" />
                </div>

                <div className="bg-surface-container-lowest p-6 shadow-sm rounded-3xl sm:p-10 border border-outline-variant/10">
                    <DeleteUserForm className="max-w-xl" />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
