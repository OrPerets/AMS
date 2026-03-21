import { useCallback, useMemo, useRef, useState } from 'react';

type FieldValidator<T> = (value: T[keyof T], values: T) => string;

type FieldValidators<T> = {
  [K in keyof T]?: FieldValidator<T>;
};

type FieldErrors<T> = {
  [K in keyof T]?: string;
};

type TouchedFields<T> = {
  [K in keyof T]?: boolean;
};

interface UseFormValidationOptions<T extends Record<string, any>> {
  initialValues: T;
  validators: FieldValidators<T>;
  validateOn?: 'blur' | 'submit' | 'change';
}

export function useFormValidation<T extends Record<string, any>>({
  initialValues,
  validators,
  validateOn = 'blur',
}: UseFormValidationOptions<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [touched, setTouched] = useState<TouchedFields<T>>({});
  const [submitted, setSubmitted] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const firstErrorRef = useRef<HTMLElement | null>(null);

  const errors = useMemo<FieldErrors<T>>(() => {
    const result: FieldErrors<T> = {};
    for (const key of Object.keys(validators) as Array<keyof T>) {
      const validator = validators[key];
      if (validator) {
        const error = validator(values[key], values);
        if (error) {
          result[key] = error;
        }
      }
    }
    return result;
  }, [values, validators]);

  const visibleErrors = useMemo<FieldErrors<T>>(() => {
    if (validateOn === 'change') return errors;

    const result: FieldErrors<T> = {};
    for (const key of Object.keys(errors) as Array<keyof T>) {
      if (submitted || (validateOn === 'blur' && touched[key])) {
        result[key] = errors[key];
      }
    }
    return result;
  }, [errors, touched, submitted, validateOn]);

  const hasErrors = useMemo(() => Object.keys(errors).length > 0, [errors]);

  const errorList = useMemo(() => {
    return (Object.keys(errors) as Array<keyof T>)
      .filter((key) => errors[key])
      .map((key) => ({ field: key as string, message: errors[key]! }));
  }, [errors]);

  const visibleErrorList = useMemo(() => {
    return (Object.keys(visibleErrors) as Array<keyof T>)
      .filter((key) => visibleErrors[key])
      .map((key) => ({ field: key as string, message: visibleErrors[key]! }));
  }, [visibleErrors]);

  const setFieldValue = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setSuccessMessage(null);
  }, []);

  const setFieldTouched = useCallback(<K extends keyof T>(field: K) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const handleBlur = useCallback(<K extends keyof T>(field: K) => {
    setFieldTouched(field);
  }, [setFieldTouched]);

  const resetForm = useCallback((nextValues?: T) => {
    setValues(nextValues ?? initialValues);
    setTouched({});
    setSubmitted(false);
    setSuccessMessage(null);
  }, [initialValues]);

  const scrollToFirstError = useCallback(() => {
    requestAnimationFrame(() => {
      const firstInvalid = document.querySelector<HTMLElement>(
        '[aria-invalid="true"], [data-field-error="true"]',
      );
      if (firstInvalid) {
        firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const input = firstInvalid.querySelector<HTMLElement>('input, textarea, select') ?? firstInvalid;
        input.focus({ preventScroll: true });
      }
    });
  }, []);

  const validate = useCallback((): boolean => {
    setSubmitted(true);
    if (hasErrors) {
      scrollToFirstError();
      return false;
    }
    return true;
  }, [hasErrors, scrollToFirstError]);

  const getFieldProps = useCallback(
    <K extends keyof T>(field: K) => ({
      value: values[field],
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFieldValue(field, e.target.value as T[K]);
      },
      onBlur: () => handleBlur(field),
      error: visibleErrors[field] ? true : false,
    }),
    [values, visibleErrors, setFieldValue, handleBlur],
  );

  const getFieldError = useCallback(
    <K extends keyof T>(field: K): string | undefined => visibleErrors[field],
    [visibleErrors],
  );

  const isFieldTouched = useCallback(
    <K extends keyof T>(field: K): boolean => !!touched[field],
    [touched],
  );

  return {
    values,
    setValues,
    errors,
    visibleErrors,
    visibleErrorList,
    errorList,
    hasErrors,
    touched,
    submitted,
    successMessage,
    setSuccessMessage,
    setFieldValue,
    setFieldTouched,
    handleBlur,
    resetForm,
    validate,
    scrollToFirstError,
    getFieldProps,
    getFieldError,
    isFieldTouched,
    firstErrorRef,
  };
}
