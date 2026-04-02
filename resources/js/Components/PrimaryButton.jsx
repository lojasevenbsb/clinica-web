export default function PrimaryButton({
    className = '',
    disabled,
    children,
    ...props
}) {
    return (
        <button
            {...props}
            className={
                `inline-flex items-center justify-center rounded-xl border border-transparent bg-primary px-6 py-3 font-semibold text-on-primary transition-all duration-200 shadow-sm hover:bg-primary-container hover:text-on-primary-container hover:shadow-[0_8px_24px_rgba(70,98,80,0.2)] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:scale-[0.98] ${
                    disabled && 'opacity-25'
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
