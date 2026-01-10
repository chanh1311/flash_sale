import * as React from 'react';
import { Input } from './input';
import { cn } from '@/lib/utils';

interface LabeledInputProps extends React.ComponentProps<'input'> {
    label: string;
    error?: string;
}

function LabeledInput({ label, error, className, id, ...props }: LabeledInputProps) {
    const inputId = id || label.toLowerCase().replace(/\s+/g, '-');

    return (
        <div className="space-y-1">
            <label
                htmlFor={inputId}
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
                {label}
            </label>
            <Input
                id={inputId}
                className={cn(error && 'border-red-500', className)}
                {...props}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
    );
}

export { LabeledInput };
