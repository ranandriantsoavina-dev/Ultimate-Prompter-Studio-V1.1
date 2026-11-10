import React from 'react';
import { Layers } from 'lucide-react';

export interface SubcategoryOption {
  id: string;
  name: string;
}

export interface SubcategorySelectorProps {
  subcategories: SubcategoryOption[];
  value: string;
  onChange: (subcategoryId: string) => void;
  categoryName?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
}

export const SubcategorySelector: React.FC<SubcategorySelectorProps> = ({
  subcategories,
  value,
  onChange,
  categoryName,
  label = 'Theme / Subcategory',
  required = true,
  disabled = false
}) => {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-medium text-white/80 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-orange-400 stroke-[1.8]" />
          <span>{label}</span>
          {required && <span className="text-orange-400 font-bold">*</span>}
        </label>
        {categoryName && (
          <span className="text-[10px] text-white/40 font-mono">
            {categoryName}
          </span>
        )}
      </div>

      <div className="relative">
        <select
          value={value}
          required={required}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/[0.1] text-xs text-white appearance-none cursor-pointer focus:outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed pr-8"
        >
          {subcategories.length === 0 ? (
            <option value="" disabled>
              No options available
            </option>
          ) : (
            subcategories.map((sub) => (
              <option key={sub.id} value={sub.id} className="bg-[#15131a] text-white py-1">
                {sub.name}
              </option>
            ))
          )}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-white/50">
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </div>
      </div>
      <p className="text-[10px] text-white/40 leading-relaxed">
        Assigns this element to the selected theme or subcategory within {categoryName || 'this category'}.
      </p>
    </div>
  );
};
