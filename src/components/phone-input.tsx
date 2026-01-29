"use client";

import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

interface PhoneInputFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

export function PhoneInputField({
  value,
  onChange,
  error,
  disabled = false,
}: PhoneInputFieldProps) {
  return (
    <div>
      <PhoneInput
        country="fr"
        value={value}
        onChange={onChange}
        disabled={disabled}
        inputStyle={{
          width: "100%",
          height: "44px",
          fontSize: "16px",
          borderRadius: "8px",
          borderColor: error ? "#fca5a5" : "#d1d5db",
        }}
        buttonStyle={{
          borderRadius: "8px 0 0 8px",
          borderColor: error ? "#fca5a5" : "#d1d5db",
        }}
        enableSearch
        searchPlaceholder="Rechercher un pays..."
        searchNotFound="Pays non trouvé"
        preferredCountries={["fr", "be", "ch", "ca", "ma", "dz", "tn", "sn", "ci"]}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
