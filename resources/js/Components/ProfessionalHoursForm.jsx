import React from 'react';
import Checkbox from '@/Components/Checkbox';
import TextInput from '@/Components/TextInput';

export default function ProfessionalHoursForm({ hours, onChange }) {
    const handleToggle = (index) => {
        const newHours = [...hours];
        newHours[index].is_open = !newHours[index].is_open;
        onChange(newHours);
    };

    const handleChange = (index, field, value) => {
        const newHours = [...hours];
        newHours[index][field] = value;
        onChange(newHours);
    };

    return (
        <div className="space-y-4">
            <div className="divide-y divide-stone-100 dark:divide-stone-800">
                {hours.map((hour, index) => (
                    <div key={index} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 first:pt-0">
                        <div className="flex items-center gap-4 min-w-[150px]">
                            <Checkbox
                                checked={hour.is_open}
                                onChange={() => handleToggle(index)}
                            />
                            <span className={`font-bold text-sm ${hour.is_open ? 'text-stone-900' : 'text-stone-400'}`}>
                                {hour.day_of_week}
                            </span>
                        </div>

                        <div className={`flex items-center gap-4 transition-opacity ${hour.is_open ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-stone-400 font-bold uppercase">Abre</span>
                                <TextInput
                                    type="time"
                                    value={hour.open_time}
                                    onChange={(e) => handleChange(index, 'open_time', e.target.value)}
                                    className="!py-1 !text-xs w-24"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-stone-400 font-bold uppercase">Fecha</span>
                                <TextInput
                                    type="time"
                                    value={hour.close_time}
                                    onChange={(e) => handleChange(index, 'close_time', e.target.value)}
                                    className="!py-1 !text-xs w-24"
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
