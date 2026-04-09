import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { useState } from 'react';
import { maskCpf, maskPhone, validateCpf, validatePhone } from '@/utils/masks';

const ESTADOS = [
    'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
    'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
];

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        name: '', birth_date: '', cpf: '', email: '', phone: '',
        address: '',
        cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '',
    });

    const [cepLoading, setCepLoading] = useState(false);
    const [cepError, setCepError]     = useState('');
    const [cpfError, setCpfError]     = useState('');
    const [phoneError, setPhoneError] = useState('');

    const buscarCep = async (cep) => {
        const limpo = cep.replace(/\D/g, '');
        if (limpo.length !== 8) return;
        setCepLoading(true); setCepError('');
        try {
            const res  = await fetch(`https://viacep.com.br/ws/${limpo}/json/`);
            const json = await res.json();
            if (json.erro) { setCepError('CEP não encontrado.'); return; }
            setData(prev => ({
                ...prev,
                logradouro: json.logradouro || '',
                bairro:     json.bairro     || '',
                cidade:     json.localidade || '',
                estado:     json.uf         || '',
            }));
        } catch {
            setCepError('Erro ao buscar CEP.');
        } finally {
            setCepLoading(false);
        }
    };

    const formatCep = (v) => {
        const d = v.replace(/\D/g, '').slice(0, 8);
        return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
    };

    const submit = (e) => { e.preventDefault(); post(route('patients.store')); };

    return (
        <AuthenticatedLayout>
            <Head title="Novo Cadastro" />

            <section className="mb-8">
                <Link href={route('patients.index')} className="text-sm text-stone-500 hover:text-primary flex items-center gap-1 mb-4">
                    <span className="material-symbols-outlined text-sm">arrow_back</span>
                    Voltar para lista
                </Link>
                <h1 className="text-3xl font-extrabold tracking-tight text-[#466250]">Novo Cadastro</h1>
                <p className="text-stone-500">Cadastre uma nova pessoa na clínica (paciente ou aluno de Pilates).</p>
            </section>

            <div className="max-w-4xl bg-white dark:bg-stone-900 rounded-3xl p-8 shadow-sm border border-stone-200 dark:border-stone-800">
                <form onSubmit={submit} className="space-y-8">

                    {/* Dados pessoais */}
                    <fieldset>
                        <legend className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4">Dados Pessoais</legend>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <InputLabel htmlFor="name" value="Nome Completo" />
                                <TextInput id="name" name="name" value={data.name} className="mt-1 block w-full" autoComplete="name" isFocused onChange={e => setData('name', e.target.value)} required />
                                <InputError message={errors.name} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="cpf" value="CPF" />
                                <TextInput
                                    id="cpf" name="cpf" value={data.cpf}
                                    className={`mt-1 block w-full ${cpfError ? 'border-red-400 focus:border-red-400 focus:ring-red-400' : ''}`}
                                    placeholder="000.000.000-00"
                                    maxLength={14}
                                    onChange={e => { setData('cpf', maskCpf(e.target.value)); setCpfError(''); }}
                                    onBlur={() => { if (data.cpf && !validateCpf(data.cpf)) setCpfError('CPF inválido.'); }}
                                    required
                                />
                                {cpfError ? <p className="text-xs text-red-500 mt-1">{cpfError}</p> : <InputError message={errors.cpf} className="mt-2" />}
                            </div>
                            <div>
                                <InputLabel htmlFor="birth_date" value="Data de Nascimento" />
                                <TextInput id="birth_date" type="date" name="birth_date" value={data.birth_date} className="mt-1 block w-full" onChange={e => setData('birth_date', e.target.value)} required />
                                <InputError message={errors.birth_date} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="email" value="E-mail" />
                                <TextInput id="email" type="email" name="email" value={data.email} className="mt-1 block w-full" autoComplete="email" onChange={e => setData('email', e.target.value)} />
                                <InputError message={errors.email} className="mt-2" />
                            </div>
                            <div>
                                <InputLabel htmlFor="phone" value="Telefone / WhatsApp" />
                                <TextInput
                                    id="phone" name="phone" value={data.phone}
                                    className={`mt-1 block w-full ${phoneError ? 'border-red-400 focus:border-red-400 focus:ring-red-400' : ''}`}
                                    placeholder="(00) 00000-0000"
                                    maxLength={15}
                                    onChange={e => { setData('phone', maskPhone(e.target.value)); setPhoneError(''); }}
                                    onBlur={() => { if (data.phone && !validatePhone(data.phone)) setPhoneError('Telefone inválido.'); }}
                                />
                                {phoneError ? <p className="text-xs text-red-500 mt-1">{phoneError}</p> : <InputError message={errors.phone} className="mt-2" />}
                            </div>
                        </div>
                    </fieldset>

                    {/* Endereço para NF */}
                    <fieldset className="border border-stone-100 dark:border-stone-800 rounded-2xl p-6">
                        <legend className="text-xs font-bold text-stone-400 uppercase tracking-widest px-2">
                            Endereço <span className="text-stone-300 font-normal normal-case tracking-normal">(para emissão de nota fiscal)</span>
                        </legend>
                        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mt-2">

                            {/* CEP */}
                            <div className="md:col-span-2">
                                <InputLabel htmlFor="cep" value="CEP" />
                                <div className="relative mt-1">
                                    <TextInput
                                        id="cep" name="cep"
                                        value={data.cep}
                                        className="block w-full pr-10"
                                        placeholder="00000-000"
                                        onChange={e => {
                                            const v = formatCep(e.target.value);
                                            setData('cep', v);
                                            if (v.replace(/\D/g,'').length === 8) buscarCep(v);
                                        }}
                                        maxLength={9}
                                    />
                                    {cepLoading && (
                                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 animate-spin text-lg">progress_activity</span>
                                    )}
                                </div>
                                {cepError && <p className="text-xs text-red-500 mt-1">{cepError}</p>}
                                <InputError message={errors.cep} className="mt-2" />
                            </div>

                            {/* Logradouro */}
                            <div className="md:col-span-4">
                                <InputLabel htmlFor="logradouro" value="Logradouro" />
                                <TextInput id="logradouro" name="logradouro" value={data.logradouro} className="mt-1 block w-full" placeholder="Rua, Avenida, etc." onChange={e => setData('logradouro', e.target.value)} />
                                <InputError message={errors.logradouro} className="mt-2" />
                            </div>

                            {/* Número */}
                            <div className="md:col-span-1">
                                <InputLabel htmlFor="numero" value="Número" />
                                <TextInput id="numero" name="numero" value={data.numero} className="mt-1 block w-full" placeholder="Nº" onChange={e => setData('numero', e.target.value)} />
                                <InputError message={errors.numero} className="mt-2" />
                            </div>

                            {/* Complemento */}
                            <div className="md:col-span-3">
                                <InputLabel htmlFor="complemento" value="Complemento" />
                                <TextInput id="complemento" name="complemento" value={data.complemento} className="mt-1 block w-full" placeholder="Apto, Sala, Bloco…" onChange={e => setData('complemento', e.target.value)} />
                                <InputError message={errors.complemento} className="mt-2" />
                            </div>

                            {/* Bairro */}
                            <div className="md:col-span-2">
                                <InputLabel htmlFor="bairro" value="Bairro" />
                                <TextInput id="bairro" name="bairro" value={data.bairro} className="mt-1 block w-full" onChange={e => setData('bairro', e.target.value)} />
                                <InputError message={errors.bairro} className="mt-2" />
                            </div>

                            {/* Cidade */}
                            <div className="md:col-span-4">
                                <InputLabel htmlFor="cidade" value="Cidade" />
                                <TextInput id="cidade" name="cidade" value={data.cidade} className="mt-1 block w-full" onChange={e => setData('cidade', e.target.value)} />
                                <InputError message={errors.cidade} className="mt-2" />
                            </div>

                            {/* Estado */}
                            <div className="md:col-span-2">
                                <InputLabel htmlFor="estado" value="Estado (UF)" />
                                <select id="estado" name="estado" value={data.estado} onChange={e => setData('estado', e.target.value)}
                                    className="mt-1 block w-full border-stone-200 dark:border-stone-800 dark:bg-stone-900 rounded-xl shadow-sm focus:border-primary focus:ring-primary">
                                    <option value="">UF</option>
                                    {ESTADOS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                                </select>
                                <InputError message={errors.estado} className="mt-2" />
                            </div>
                        </div>
                    </fieldset>

                    <div className="flex items-center justify-end pt-4 border-t border-stone-100 dark:border-stone-800">
                        <PrimaryButton className="px-10 py-3" disabled={processing}>
                            Salvar Cadastro
                        </PrimaryButton>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
