import React, { useState, memo } from 'react';
import { FiBookOpen, FiChevronDown } from 'react-icons/fi';

export const LogicHelper = memo(function LogicHelper() {
  const [isOpen, setIsOpen] = useState(false);
  const examples = [
    { title: '1. Basic Text Search', code: "'urgent' in msg", desc: "Checks if a word appears in the last message." },
    { title: '2. Simple JSON Key', code: "status == 'active'", desc: "Matches a top-level field from your data." },
    { title: '3. Basic Multi-Condition', code: "status == 'gold' and score >= 500", desc: "Combines two conditions using 'and'." },
    { title: '4. Nested Data (Dot Notation)', code: "user.profile.id == 101", desc: "Access deep JSON data safely." },
    { title: '5. Complex Grouping', code: "(status == 'VIP' or total > 5000) and 'fast_track' in msg", desc: "Uses parentheses to group logic clearly." },
    { title: '6. Safe Callbacks', code: "data.get('score', 0) >= 740", desc: "Uses a default value if the field is missing." },
    { title: '7. Email Domain Check (Text)', code: "endsWith(msg, '@trans.io')", desc: "Extracts and validates email domain from plain text messages." },
    { title: '8. Email Domain Check (JSON)', code: "endsWith(email, '@trans.io')", desc: "Direct property check on structured JSON data." },
    { title: '9. Exclude Subdomain (Combined)', code: "endsWith(email, '@trans.io') and not startsWith(email, 'xyz')", desc: "Two string conditions: must end with domain AND NOT start with xyz." },
    { title: '10. Username Pattern', code: "startsWith(username, 'admin')", desc: "Check if username starts with a specific prefix." },
    { title: '11. Case-Insensitive Match', code: "equalsIgnoreCase(organization, 'TANTOR')", desc: "Case-insensitive equality check for status/type fields." },
    { title: '12. Message Contains Error', code: "contains(msg, 'ERROR') and not contains(msg, 'WARNING')", desc: "Check for errors but exclude false positives." },
    { title: '13. Regex Email Validation', code: "matches(email, r'^[a-zA-Z0-9._%+-]+@trans\\\\.io$')", desc: "Full regex pattern validation for format enforcement." },
    { title: '14. Nested JSON String Match', code: "endsWith(user.profile.email, '@trans.io') and user.organization == 'Tantor'", desc: "Combine nested property access with string matching." },
    { title: '15. OCR Content Check', code: "latest_ocr_output != None", desc: "Ensures the OCR process returned content before proceeding (no brackets needed)." },
  ];

  return (
    <div className="mt-4 rounded-lg border border-[var(--border)] overflow-hidden bg-slate-50">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 px-3.5 cursor-pointer flex items-center justify-between bg-slate-100"
      >
        <span className="text-[11px] font-bold text-[var(--text-primary)] flex items-center gap-1.5">
          <FiBookOpen size={12} className="text-[var(--accent-btn)]" /> LOGIC EXAMPLES GUIDE
        </span>
        <FiChevronDown size={14} className="transition-transform duration-200" style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }} />
      </div>

      {isOpen && (
        <div className="p-2.5">
          {examples.map((ex, i) => (
            <div key={i} className="mb-3">
              <div className="text-[10px] font-bold text-[var(--text-muted)] mb-1">{ex.title}</div>
              <div className="bg-[#1E293B] text-[#F1F5F9] p-1.5 px-2.5 rounded-md text-[11px] font-mono mb-1 relative whitespace-pre-wrap break-all">
                {ex.code}
              </div>
              <div className="text-[10px] text-[var(--text-secondary)] italic">{ex.desc}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
