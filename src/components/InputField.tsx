"use client";

import { FieldError } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type InputFieldProps = {
  label: string;
  type?: string;
  register: any;
  name: string;
  defaultValue?: string | number;
  error?: FieldError;
  hidden?: boolean;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
};

const InputField = ({
  label,
  type = "text",
  register,
  name,
  defaultValue,
  error,
  hidden,
  inputProps,
}: InputFieldProps) => {
  const fieldId = `field-${name}`;

  if (hidden) {
    return <input type="hidden" {...register(name)} defaultValue={defaultValue} />;
  }

  return (
    <div className="flex flex-col gap-2 w-full md:w-1/4">
      <Label htmlFor={fieldId}>{label}</Label>
      <Input
        id={fieldId}
        type={type}
        {...register(name)}
        defaultValue={defaultValue}
        aria-invalid={!!error}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        className={cn(error && "border-destructive")}
        {...inputProps}
      />
      {error?.message && (
        <p id={`${fieldId}-error`} className="text-xs text-destructive" role="alert">
          {error.message.toString()}
        </p>
      )}
    </div>
  );
};

export default InputField;
