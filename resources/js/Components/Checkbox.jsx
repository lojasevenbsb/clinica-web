export default function Checkbox({ className = '', ...props }) {
    return (
        <input
            {...props}
            type="checkbox"
            className={
                'rounded border-outline-variant text-primary shadow-sm focus:ring-primary/50 transition-colors duration-200 ' +
                className
            }
        />
    );
}
