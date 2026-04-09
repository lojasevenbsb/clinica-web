import React from 'react';
import Checkbox from '@/Components/Checkbox';
import TextInput from '@/Components/TextInput';

function TimeRange({ label, openValue, closeValue, onOpenChange, onCloseChange, onRemove }) {
    return (
        <div className="flex items-center gap-3">
            {label && <span className="text-[10px] text-stone-400 font-bold uppercase w-10 shrink-0">{label}</span>}
            <div className="flex items-center gap-2">
                <span className="text-[10px] text-stone-400 font-bold uppercase">Abre</span>
                <TextInput type="time" value={openValue} onChange={e => onOpenChange(e.target.value)} className="!py-1 !text-xs w-24" />
            </div>
            <div className="flex items-center gap-2">
                <span className="text-[10px] text-stone-400 font-bold uppercase">Fecha</span>
                <TextInput type="time" value={closeValue} onChange={e => onCloseChange(e.target.value)} className="!py-1 !text-xs w-24" />
            </div>
            {onRemove && (
                <button type="button" onClick={onRemove} className="text-stone-300 hover:text-red-400 transition-colors" title="Remover período">
                    <span className="material-symbols-outlined text-base">remove_circle</span>
                </button>
            )}
        </div>
    );
}

export default function ProfessionalHoursForm({ hours, onChange }) {
    const update = (index, fields) => {
        const newHours = hours.map((h, i) => i === index ? { ...h, ...fields } : h);
        onChange(newHours);
    };

    return (
        <div className="space-y-4">
            <div className="divide-y divide-stone-100 dark:divide-stone-800">
                {hours.map((hour, index) => (
                    <div key={index} className="py-4 first:pt-0">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                            {/* Checkbox + dia */}
                            <div className="flex items-center gap-4 min-w-[150px] pt-1">
                                <Checkbox checked={hour.is_open} onChange={() => update(index, { is_open: !hour.is_open })} />
                                <span className={`font-bold text-sm ${hour.is_open ? 'text-stone-900 dark:text-stone-100' : 'text-stone-400'}`}>
                                    {hour.day_of_week}
                                </span>
                            </div>

                            {/* Períodos */}
                            <div className={`flex flex-col gap-2 transition-opacity ${hour.is_open ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                                {/* Período 1 */}
                                <TimeRange
                                    openValue={hour.open_time}
                                    closeValue={hour.close_time}
                                    onOpenChange={v => update(index, { open_time: v })}
                                    onCloseChange={v => update(index, { close_time: v })}
                                />

                                {/* Período 2 */}
                                {hour.has_second_period && (
                                    <TimeRange
                                        openValue={hour.open_time_2 || ''}
                                        closeValue={hour.close_time_2 || ''}
                                        onOpenChange={v => update(index, { open_time_2: v })}
                                        onCloseChange={v => update(index, { close_time_2: v })}
                                        onRemove={() => update(index, { has_second_period: false, open_time_2: null, close_time_2: null })}
                                    />
                                )}

                                {/* Botão adicionar período */}
                                {!hour.has_second_period && (
                                    <button
                                        type="button"
                                        onClick={() => update(index, { has_second_period: true, open_time_2: '14:00', close_time_2: '18:00' })}
                                        className="flex items-center gap-1 text-xs text-[#466250] hover:text-[#384f40] font-semibold transition-colors self-start"
                                    >
                                        <span className="material-symbols-outlined text-sm">add_circle</span>
                                        Adicionar período
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
