export const isRangeParameter = (paramValue) => (
    typeof paramValue === 'object' &&
    paramValue !== null &&
    paramValue.low !== undefined &&
    paramValue.high !== undefined
);

export const isNestedParameter = (paramValue) => (
    typeof paramValue === 'object' &&
    paramValue !== null &&
    !isRangeParameter(paramValue) &&
    Object.values(paramValue).length > 0 &&
    Object.values(paramValue).every(isRangeParameter)
);

const hasValidationError = (errorValue) => {
    if (Array.isArray(errorValue)) {
        return errorValue.some(hasValidationError);
    }

    if (errorValue && typeof errorValue === 'object') {
        return Object.values(errorValue).some(hasValidationError);
    }

    return Boolean(errorValue);
};

export const hasValidationErrors = (errors) => (
    errors && Object.values(errors).some(hasValidationError)
);

export const validateHyperparameterValue = (paramName, paramValue, value, silent = false) => {
    const stringValue = value === null || value === undefined ? '' : String(value);

    // Required checks are handled by the algorithm-level validator.
    if (stringValue.trim() === '') {
        return true;
    }

    if (isRangeParameter(paramValue)) {
        const trimmedValue = stringValue.trim();
        const specialValues = paramValue.special
            ? (Array.isArray(paramValue.special) ? paramValue.special : [paramValue.special])
            : [];

        if (specialValues.some(special =>
            String(special).toLowerCase() === trimmedValue.toLowerCase()
        )) {
            return true;
        }

        const numValue = Number(trimmedValue);
        const low = Number(paramValue.low);
        const high = Number(paramValue.high);
        const specialText = specialValues.join(', ');

        if (!Number.isFinite(numValue)) {
            return silent
                ? false
                : `Must be a number between ${paramValue.low} and ${paramValue.high}${specialText ? ` or ${specialText}` : ''}`;
        }

        if (numValue < low || numValue > high) {
            return silent
                ? false
                : `Value must be between ${paramValue.low} and ${paramValue.high}${specialText ? ` (or ${specialText})` : ''}`;
        }
    }

    return true;
};

export const validateMinPeriodsAgainstWindow = (hyperparameters, hyperparameterValues) => {
    const minPeriodsConfig = hyperparameters?.min_periods;
    if (!isRangeParameter(minPeriodsConfig) || !minPeriodsConfig.warning) {
        return true;
    }

    const minPeriods = Number(hyperparameterValues?.min_periods);
    const window = Number(hyperparameterValues?.window);

    if (!Number.isFinite(minPeriods) || !Number.isFinite(window)) {
        return true;
    }

    return minPeriods > window ? minPeriodsConfig.warning : true;
};

export const validateDModelAgainstHeads = (hyperparameters, hyperparameterValues) => {
    const dModelConfig = hyperparameters?.d_model;
    if (!isRangeParameter(dModelConfig) || !dModelConfig.warning) {
        return true;
    }

    const headsParam = hyperparameters?.nhead
        ? 'nhead'
        : hyperparameters?.n_heads
            ? 'n_heads'
            : null;
    if (!headsParam) {
        return true;
    }

    const dModel = Number(hyperparameterValues?.d_model);
    const heads = Number(hyperparameterValues?.[headsParam]);

    if (!Number.isFinite(dModel) || !Number.isFinite(heads) || heads === 0) {
        return true;
    }

    return dModel % heads !== 0 ? dModelConfig.warning : true;
};

const isFilled = (value) => (
    value !== null &&
    value !== undefined &&
    String(value).trim() !== ''
);

export const validateAlgorithm = (algo) => {
    if (algo.configMode === 'Base') {
        return true;
    }

    if (algo.configMode === 'Hyper Parameter') {
        if (hasValidationErrors(algo.errors)) {
            return false;
        }

        for (const [paramName, paramValue] of Object.entries(algo.hyperparameters || {})) {
            const value = algo.hyperparameterValues?.[paramName];

            if (typeof paramValue === 'string') {
                if (!isFilled(value)) return false;
            } else if (isRangeParameter(paramValue)) {
                if (!isFilled(value)) return false;
                if (validateHyperparameterValue(paramName, paramValue, value, true) !== true) {
                    return false;
                }
            } else if (isNestedParameter(paramValue)) {
                const nestedValues = value || {};

                for (const [subParam, subConfig] of Object.entries(paramValue)) {
                    const nestedValue = nestedValues[subParam];
                    if (!isFilled(nestedValue)) return false;
                    if (validateHyperparameterValue(subParam, subConfig, nestedValue, true) !== true) {
                        return false;
                    }
                }
            }
        }

        if (validateMinPeriodsAgainstWindow(algo.hyperparameters, algo.hyperparameterValues) !== true) {
            return false;
        }

        if (validateDModelAgainstHeads(algo.hyperparameters, algo.hyperparameterValues) !== true) {
            return false;
        }

        return true;
    }

    if (algo.configMode === 'Grid Search') {
        if (hasValidationErrors(algo.gridSearchErrors)) {
            return false;
        }

        for (const [paramName, paramValue] of Object.entries(algo.hyperparameters || {})) {
            if (isNestedParameter(paramValue)) {
                const nestedValues = algo.gridSearchValues?.[paramName] || {};

                for (const [subParam, subConfig] of Object.entries(paramValue)) {
                    const filledValues = (nestedValues[subParam] || []).filter(isFilled);
                    if (filledValues.length === 0) return false;
                    if (filledValues.some(value =>
                        validateHyperparameterValue(subParam, subConfig, value, true) !== true
                    )) {
                        return false;
                    }
                }
                continue;
            }

            const filledValues = (algo.gridSearchValues?.[paramName] || []).filter(isFilled);
            if (filledValues.length === 0) return false;

            if (
                isRangeParameter(paramValue) &&
                filledValues.some(value =>
                    validateHyperparameterValue(paramName, paramValue, value, true) !== true
                )
            ) {
                return false;
            }
        }

        return true;
    }

    return true;
};
