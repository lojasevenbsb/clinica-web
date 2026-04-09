export const maskCpf = (v) => {
    const d = v.replace(/\D/g, '').slice(0, 11);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0,3)}.${d.slice(3)}`;
    if (d.length <= 9) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`;
    return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9,11)}`;
};

export const maskPhone = (v) => {
    const d = v.replace(/\D/g, '').slice(0, 11);
    if (d.length <= 2) return d.length ? `(${d}` : '';
    if (d.length <= 6) return `(${d.slice(0,2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
    return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7,11)}`;
};

export const validateCpf = (cpf) => {
    const d = cpf.replace(/\D/g, '');
    if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;

    const calc = (digits, factor) => {
        const sum = digits.split('').reduce((acc, n, i) => acc + Number(n) * (factor - i), 0);
        const rest = (sum * 10) % 11;
        return rest === 10 || rest === 11 ? 0 : rest;
    };

    return (
        calc(d.slice(0, 9), 10) === Number(d[9]) &&
        calc(d.slice(0, 10), 11) === Number(d[10])
    );
};

export const validatePhone = (phone) => {
    const d = phone.replace(/\D/g, '');
    return d.length === 10 || d.length === 11;
};
