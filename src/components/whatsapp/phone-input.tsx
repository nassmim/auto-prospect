"use client";

import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

type PhoneInputFieldProps = {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  label?: string;
};

export function PhoneInputField({ value, onChange, error, label }: PhoneInputFieldProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-foreground">{label}</label>
      )}
      <div className="phone-input-wrapper">
        <PhoneInput
          country="fr"
          value={value}
          onChange={onChange}
          containerClass={error ? "error" : ""}
          placeholder="Ton numéro WhatsApp"
        />
      </div>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}
