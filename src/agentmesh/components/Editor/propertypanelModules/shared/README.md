# Reusable Property Panel Components Catalog

This directory contains standardized, highly-optimized React components for use across the various property panels in the AgentMesh Editor. Import these components directly via the barrel file: `import { ComponentName } from "../SharedComponents"`.

---

## 1. Core Primitives (`shared/primitives.jsx`)
* **`Field`**: A label wrapper featuring a description hint.
* **`Input`**: Standard visual input box matching the properties panel aesthetics.
* **`Textarea`**: Standard multiline text inputs.
* **`Select`**: Standard styled dropdown picker.
* **`Toggle`**: Full-width interactive toggle switch.
* **`MiniatureToggle`**: Compact switch (ideal for headers/accordion lines).
* **`CommaArrayEditor`**: Tag/list input editor for lists of strings.
* **`VariablePicker`**: Interpolation variable inspector.
* **`HitlConfigSection`**: Pause configurations for Human-in-the-Loop steps.

---

## 2. API Configurations (`shared/ApiConfigSection.jsx`)
* **`ApiConfigSection`**: A tabbed control interface containing Endpoint URLs, Query Parameters, headers, manual Authentication configurations, and Request Body editors.
  * **Props**:
    * `data` (object): Config state.
    * `update` (function): Update payload callback.
    * `prefix` (string): Standard field prefix (default: `'api_'`).
    * `urlKey` (string): Custom endpoint key (default: `prefix + 'url'`).
* **`CollapsibleApiConfig`**: Compact collapsible accordion mapping to sub-APIs.
* **`CustomCollapsibleApiConfig`**: Collapsible container for mock/pre-built platform integrations.

---

## 3. Accordions and Editors (`shared/ListAccordionItem.jsx`, `RuleAccordionItem.jsx`)
* **`ListAccordionItem`**: Standard accordion wrapper providing reordering controls, toggles, deletion triggers, and collapsible bodies. Used to configure dynamic lists of objects (such as multiple API queries, rules, schemas).
  * **Props**:
    * `headerContent` (ReactNode): Custom title block (e.g. badge and path).
    * `index` (number): 0-indexed position.
    * `totalItems` (number): Length of collection.
    * `isCollapsed` (boolean): Panel open status.
    * `onToggleCollapse` (function): Triggers expansion.
    * `isEnabled` (boolean): Active state toggle.
    * `onToggleEnabled` (function): Callback on state toggles.
    * `onMoveUp` / `onMoveDown` (function): Reordering triggers.
    * `onDelete` (function): Deletion trigger.
* **`RuleAccordionItem`**: Custom accordion optimized for rule engines.

---

## 4. Key-Value Editors (`shared/KeyValueEditor.jsx`)
* **`KeyValueEditor`**: Table component displaying header/param keys and dynamic values.

---

## 5. LLM Configuration Managers (`shared/LlmConfigs.jsx`)
* **`LLMConfigSection`**: Model and provider settings selector.
* **`IterationConfigSection`**: Self-correcting/loop quality checks.
* **`NodeIdList`** / **`ErrorTargetField`**: Node selector helpers.

---

## 6. Complex Data Transformation Editors (`shared/complexEditors.jsx`)
* **`FormFieldsEditor`**: Renders custom dynamic fields for Form Nodes.
* **`FormDecisionsEditor`**: Renders custom buttons for Form Nodes.
* **`WeightageCategoriesEditor`**: Configures risk analysis weights.
* **`VisualOperationsEditor`**: Configures JMESPath/Operation transformers.
