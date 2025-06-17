
import React from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface ModernRadioOption {
  value: string;
  label: string;
  color?: 'green' | 'red' | 'blue' | 'default';
}

interface ModernRadioGroupProps {
  value: string;
  onValueChange: (value: string) => void;
  options: ModernRadioOption[];
  name?: string;
  className?: string;
}

const ModernRadioGroup = ({ value, onValueChange, options, name, className }: ModernRadioGroupProps) => {
  return (
    <RadioGroup value={value} onValueChange={onValueChange} className={cn("flex gap-2", className)}>
      {options.map((option) => (
        <div key={option.value} className="flex items-center space-x-2">
          <RadioGroupItem 
            value={option.value} 
            id={`${name}-${option.value}`}
            className="sr-only"
          />
          <Label
            htmlFor={`${name}-${option.value}`}
            className={cn(
              "flex items-center justify-center px-6 py-3 rounded-lg border-2 cursor-pointer transition-all duration-200 min-w-[80px] font-medium",
              "hover:scale-105 hover:shadow-md",
              value === option.value ? [
                option.color === 'green' && "bg-green-500 border-green-500 text-white",
                option.color === 'red' && "bg-red-500 border-red-500 text-white",
                option.color === 'blue' && "bg-blue-500 border-blue-500 text-white",
                !option.color && "bg-primary border-primary text-primary-foreground"
              ] : [
                option.color === 'green' && "border-green-200 text-green-700 hover:border-green-300",
                option.color === 'red' && "border-red-200 text-red-700 hover:border-red-300",
                option.color === 'blue' && "border-blue-200 text-blue-700 hover:border-blue-300",
                !option.color && "border-gray-200 text-gray-700 hover:border-gray-300"
              ]
            )}
          >
            {option.label}
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
};

export default ModernRadioGroup;
