import React from "react";
import PropTypes from "prop-types";
import { Field, Input, WeightageCategoriesEditor, CommaArrayEditor } from "./SharedComponents";
import { FiPlus, FiTrash2, FiInfo } from "react-icons/fi";

export default function WeightageConfig({ data, update }) {
  const bands = data.weightage_risk_bands || [];
  const crossRules = data.weightage_cross_rules || [];

  const addBand = () => {
    update({
      weightage_risk_bands: [...bands, { min_score: 0, max_score: 100, label: "New Band", grade: "A" }]
    });
  };

  const updateBand = (idx, patch) => {
    const next = [...bands];
    next[idx] = { ...next[idx], ...patch };
    update({ weightage_risk_bands: next });
  };

  const removeBand = (idx) => {
    update({
      weightage_risk_bands: bands.filter((_, i) => i !== idx)
    });
  };

  const addCrossRule = () => {
    update({
      weightage_cross_rules: [...crossRules, { condition: "category.normalized_score > 50", penalty_weight: -10, rule_id: "CROSS_01", enabled: true }]
    });
  };

  const updateCrossRule = (idx, patch) => {
    const next = [...crossRules];
    next[idx] = { ...next[idx], ...patch };
    update({ weightage_cross_rules: next });
  };

  const removeCrossRule = (idx) => {
    update({
      weightage_cross_rules: crossRules.filter((_, i) => i !== idx)
    });
  };

  return (
    <>
      <Field
        label="Output Context Key"
        hint="The context key where the final weightage scoring JSON breakdown is saved. Defaults to weightage_result."
      >
        <Input
          stripBraces
          value={data.weightage_output_key ?? "weightage_result"}
          onChange={(v) => update({ weightage_output_key: v })}
          placeholder="weightage_result"
        />
      </Field>

      <div className="flex gap-2.5 my-3">
        <div className="flex-1">
          <Field label="Approve Threshold (%)" hint="Min score to approve automatically.">
            <Input
              type="number"
              value={data.weightage_approve_threshold ?? 80}
              onChange={(v) => update({ weightage_approve_threshold: Number.parseFloat(v) || 0 })}
              placeholder="80"
            />
          </Field>
        </div>
        <div className="flex-1">
          <Field label="Review Threshold (%)" hint="Min score for manual review.">
            <Input
              type="number"
              value={data.weightage_review_threshold ?? 50}
              onChange={(v) => update({ weightage_review_threshold: Number.parseFloat(v) || 0 })}
              placeholder="50"
            />
          </Field>
        </div>
      </div>

      <Field
        label="Context Output Flags"
        hint="Comma-separated flat flag names to export to top-level context, e.g., is_approved, requires_review, is_rejected, is_high_risk, kill_switch_triggered"
      >
        <CommaArrayEditor
          value={data.weightage_output_flags}
          onChange={(v) => update({ weightage_output_flags: v })}
          placeholder="is_approved, requires_review, is_high_risk"
        />
      </Field>

      <div className="border-t border-slate-200 pt-3 my-4">
        <div className="text-xs font-bold text-[var(--text-secondary)] mb-2 uppercase tracking-wide flex items-center gap-1">
          Risk Bands & Grades <FiInfo size={13} className="text-slate-400 cursor-help" title="Define custom score ranges mapped to risk labels and letter grades (e.g. 0-40 = Low Risk, Grade A)." />
        </div>
        <div className="flex flex-col gap-2">
          {bands.map((band, idx) => (
            <div key={idx} className="flex gap-2 items-center bg-slate-50 p-2 rounded-lg border border-slate-200">
              <div className="w-[85px]">
                <Input
                  type="number"
                  value={band.min_score}
                  onChange={(v) => updateBand(idx, { min_score: Number.parseFloat(v) || 0 })}
                  placeholder="Min"
                />
              </div>
              <span className="text-xs text-slate-400">-</span>
              <div className="w-[85px]">
                <Input
                  type="number"
                  value={band.max_score}
                  onChange={(v) => updateBand(idx, { max_score: Number.parseFloat(v) || 0 })}
                  placeholder="Max"
                />
              </div>
              <div className="flex-1">
                <Input
                  value={band.label}
                  onChange={(v) => updateBand(idx, { label: v })}
                  placeholder="Risk Label"
                />
              </div>
              <div className="w-[55px]">
                <Input
                  value={band.grade}
                  onChange={(v) => updateBand(idx, { grade: v })}
                  placeholder="Grade"
                />
              </div>
              <button
                onClick={() => removeBand(idx)}
                className="bg-transparent border-none text-red-500 cursor-pointer p-1"
              >
                <FiTrash2 size={13} />
              </button>
            </div>
          ))}
          <button
            onClick={addBand}
            className="self-start flex items-center gap-1.5 p-1.5 px-3 bg-white border border-dashed border-slate-300 rounded-lg text-xs text-[var(--accent-btn)] font-semibold cursor-pointer"
          >
            <FiPlus size={12} /> Add Risk Band
          </button>
        </div>
      </div>

      <div className="border-t border-slate-200 pt-3 my-4">
        <div className="text-xs font-bold text-[var(--text-secondary)] mb-2 uppercase tracking-wide flex items-center gap-1">
          Cross-Category Rules <FiInfo size={13} className="text-slate-400 cursor-help" title="Rules evaluated across category scores after individual category assessment (e.g. aml_checks.normalized_score > 50 and txn_patterns.normalized_score > 30)." />
        </div>
        <div className="flex flex-col gap-2">
          {crossRules.map((rule, idx) => (
            <div key={idx} className="flex flex-col gap-1.5 bg-slate-50 p-2 rounded-lg border border-slate-200">
              <div className="flex gap-2 items-center">
                <div className="flex-1">
                  <Input
                    value={rule.condition}
                    onChange={(v) => updateCrossRule(idx, { condition: v })}
                    placeholder="Condition (e.g. aml_scoring.normalized_score > 50)"
                  />
                </div>
                <div className="w-[80px]">
                  <Input
                    type="number"
                    value={rule.penalty_weight}
                    onChange={(v) => updateCrossRule(idx, { penalty_weight: Number.parseFloat(v) || 0 })}
                    placeholder="Weight"
                  />
                </div>
                <button
                  onClick={() => removeCrossRule(idx)}
                  className="bg-transparent border-none text-red-500 cursor-pointer p-1"
                >
                  <FiTrash2 size={13} />
                </button>
              </div>
              <div className="flex gap-2 items-center">
                <div className="flex-1">
                  <input
                    type="text"
                    value={rule.rule_id || ''}
                    onChange={(e) => updateCrossRule(idx, { rule_id: e.target.value })}
                    placeholder="Cross Rule ID / Audit Code"
                    className="w-full px-2 py-1 rounded-md border border-[var(--border)] bg-white text-[10px] text-[var(--text-primary)] outline-none"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    id={`cross-enabled-${idx}`}
                    checked={rule.enabled !== false}
                    onChange={(e) => updateCrossRule(idx, { enabled: e.target.checked })}
                    className="cursor-pointer"
                  />
                  <label htmlFor={`cross-enabled-${idx}`} className="text-[10px] font-semibold text-[var(--text-secondary)] cursor-pointer">
                    Enabled
                  </label>
                </div>
              </div>
            </div>
          ))}
          <button
            onClick={addCrossRule}
            className="self-start flex items-center gap-1.5 p-1.5 px-3 bg-white border border-dashed border-slate-300 rounded-lg text-xs text-[var(--accent-btn)] font-semibold cursor-pointer"
          >
            <FiPlus size={12} /> Add Cross-Category Rule
          </button>
        </div>
      </div>

      <WeightageCategoriesEditor
        categories={data.weightage_categories || []}
        onChange={(cats) => update({ weightage_categories: cats })}
      />
    </>
  );
}

WeightageConfig.propTypes = {
  data: PropTypes.shape({
    weightage_output_key: PropTypes.string,
    weightage_approve_threshold: PropTypes.number,
    weightage_review_threshold: PropTypes.number,
    weightage_output_flags: PropTypes.arrayOf(PropTypes.string),
    weightage_risk_bands: PropTypes.arrayOf(
      PropTypes.shape({
        min_score: PropTypes.number,
        max_score: PropTypes.number,
        label: PropTypes.string,
        grade: PropTypes.string,
      })
    ),
    weightage_cross_rules: PropTypes.arrayOf(
      PropTypes.shape({
        condition: PropTypes.string,
        penalty_weight: PropTypes.number,
        rule_id: PropTypes.string,
        enabled: PropTypes.bool,
      })
    ),
    weightage_categories: PropTypes.arrayOf(PropTypes.object),
  }).isRequired,
  update: PropTypes.func.isRequired,
};
