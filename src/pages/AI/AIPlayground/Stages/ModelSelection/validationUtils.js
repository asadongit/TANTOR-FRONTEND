export const validateHyperparameterValue = (paramName, paramValue, value, silent = false) => {
    if (!value || value.trim() === '') {
        return true;
    }

    if (typeof paramValue === 'object' && paramValue.low && paramValue.high) {
        const trimmedValue = value.trim();

        if (paramValue.special) {
            const specialValues = Array.isArray(paramValue.special)
                ? paramValue.special
                : [paramValue.special];

            if (specialValues.some(sv => sv.toLowerCase() === trimmedValue.toLowerCase())) {
                return true;
            }
        }

        const numValue = parseFloat(trimmedValue);
        if (isNaN(numValue)) {
            if (!silent) {
                const specialText = paramValue.special
                    ? Array.isArray(paramValue.special)
                        ? paramValue.special.join(', ')
                        : paramValue.special
                    : '';
                return `Must be a number between ${paramValue.low} and ${paramValue.high}${specialText ? ` or ${specialText}` : ''}`;
            }
            return false;
        }

        const low = parseFloat(paramValue.low);
        const high = parseFloat(paramValue.high);

        if (numValue < low || numValue > high) {
            if (!silent) {
                const specialText = paramValue.special
                    ? Array.isArray(paramValue.special)
                        ? paramValue.special.join(', ')
                        : paramValue.special
                    : '';
                return `Value must be between ${paramValue.low} and ${paramValue.high}${specialText ? ` (or ${specialText})` : ''}`;
            }
            return false;
        }
    }

    return true;
};

export const validateAlgorithm = (algo) => {
    const configMode = algo.configMode;

    if (configMode === 'Base') {
        return true;
    }

    if (configMode === 'Hyper Parameter') {
        if (algo.errors && Object.values(algo.errors).some(error => error)) {
            return false;
        }

        if (algo.hyperparameters) {
            for (const [paramName, paramValue] of Object.entries(algo.hyperparameters)) {
                const value = algo.hyperparameterValues[paramName];

                if (typeof paramValue === 'string') {
                    if (!value || value === '') return false;
                }

                else if (typeof paramValue === 'object' && paramValue.low && paramValue.high) {
                    if (value && value.trim() !== '') {
                        const result = validateHyperparameterValue(paramName, paramValue, value, true);
                        if (!result) return false;
                    }
                }
            }
        }
    }

    if (configMode === 'Grid Search') {
        if (algo.gridSearchErrors && Object.values(algo.gridSearchErrors).some(errors => 
            errors && errors.some(error => error))) {
            return false;
        }

        if (algo.hyperparameters) {
            for (const [paramName, paramValue] of Object.entries(algo.hyperparameters)) {
                const values = algo.gridSearchValues[paramName] || [];

                if (typeof paramValue === 'string') {
                    const validValues = values.filter(v => v && v.trim() !== '');
                    if (validValues.length === 0) return false;
                }

                else if (typeof paramValue === 'object' && paramValue.low && paramValue.high) {
                    const filledValues = values.filter(v => v && v.trim() !== '');
                    if (filledValues.length > 0) {
                        const allValid = filledValues.every(val => 
                            validateHyperparameterValue(paramName, paramValue, val, true)
                        );
                        if (!allValid) return false;
                    }
                }
            }
        }
    }

    return true;
};