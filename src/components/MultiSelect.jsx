import { useState, useEffect, useRef } from 'react';

const MultiSelect = ({ label, options, valueStr, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const dropdownRef = useRef(null);

  const selectedValues = valueStr ? valueStr.split(',').map(s => s.trim()).filter(Boolean) : [];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (option) => {
    let newValues;
    if (selectedValues.includes(option)) {
      newValues = selectedValues.filter(v => v !== option);
    } else {
      newValues = [...selectedValues, option];
    }
    onChange(newValues.join(', '));
  };

  const addCustomOption = (e) => {
    if (e.key === 'Enter' && customInput.trim()) {
      e.preventDefault();
      if (!selectedValues.includes(customInput.trim())) {
        onChange([...selectedValues, customInput.trim()].join(', '));
      }
      setCustomInput('');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {label && <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>}
      <div 
        className="w-full px-2 py-1.5 border border-slate-300 rounded focus-within:ring-[#8C0000] focus-within:border-[#8C0000] bg-white min-h-[42px] cursor-pointer flex flex-wrap gap-1 items-center"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedValues.length === 0 && !customInput && (
          <span className="text-slate-400 text-sm ml-1">{placeholder}</span>
        )}
        {selectedValues.map(v => (
          <span key={v} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-sm border border-slate-200 flex items-center gap-1">
            {v}
            <button type="button" onClick={(e) => { e.stopPropagation(); toggleOption(v); }} className="text-slate-400 hover:text-red-500 font-bold">&times;</button>
          </span>
        ))}
        <input 
          type="text" 
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={addCustomOption}
          className="flex-1 min-w-[50px] outline-none text-sm bg-transparent border-none"
          onClick={(e) => e.stopPropagation()}
          onFocus={() => setIsOpen(true)}
          placeholder={selectedValues.length === 0 ? "" : "..."}
        />
      </div>
      
      {isOpen && (
        <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {options.length === 0 ? (
            <div className="p-2 text-sm text-slate-500">Không có dữ liệu</div>
          ) : (
            options.map(opt => (
              <label key={opt} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer text-sm">
                <input 
                  type="checkbox" 
                  checked={selectedValues.includes(opt)}
                  onChange={() => toggleOption(opt)}
                  className="rounded text-[#8C0000] focus:ring-[#8C0000]"
                />
                {opt}
              </label>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default MultiSelect;
