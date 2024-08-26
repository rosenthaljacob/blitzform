import { ChangeEvent } from 'react'
import { ZodRawShape, ZodError, ZodObject, z } from 'zod'

export type ShowValidationOn = 'touched' | 'always'
export type UntouchOn = 'focus' | 'change' | 'never'

export type FieldInputProps<TChangeFn> = {
  value: any
  disabled: boolean
  required: boolean
  name: string
  'data-valid': boolean
  onChange: TChangeFn
  onBlur: () => void
  onFocus: () => void
}

export type FieldProps<T, TChangeFn> = {
  upstreamValue: T | undefined
  disabled: boolean
  touched: boolean
  dirty: boolean
  valid: boolean
  errorMessage?: string
  inputProps: FieldInputProps<TChangeFn>
}

type ChangeFn = (...args: any[]) => any
type DefaultChangeFn = (e: ChangeEvent<HTMLElement>) => string

export type UseFieldOptions<
  TChangeFn extends ChangeFn = ChangeFn | DefaultChangeFn,
  TSchema extends ZodRawShape = ZodRawShape,
> = {
  disabled?: boolean
  disabledIf?: (formState: TSchema) => boolean
  showValidationOn?: ShowValidationOn
  unTouchOn?: UntouchOn
  parseValue?: TChangeFn
  isEqual?: (a: unknown, b: unknown) => boolean
}

export type UseFieldCtx<TSchema extends ZodRawShape> = {
  schema: ZodObject<TSchema>
  formValues: Record<keyof TSchema, any>
  isDirty: (fieldName: keyof TSchema) => boolean
  isTouched: (fieldName: keyof TSchema) => boolean
  getValue: (fieldName: keyof TSchema) => any
  setTouched: (fieldName: keyof TSchema, touched: boolean) => void
  getError: (fieldName: keyof TSchema) => ZodError | undefined
  getUpstreamValue: (fieldName: keyof TSchema) => any
  setDiff: React.Dispatch<
    React.SetStateAction<Partial<z.infer<ZodObject<TSchema>>>>
  >
  formatErrorMessage: (error: ZodError, key: keyof TSchema) => string
  defaultShowValidationOn: ShowValidationOn
  defaultUntouchOn: UntouchOn
}

type UseField = <
  TSchema extends ZodRawShape,
  TKey extends keyof TSchema,
  TValue extends z.infer<TSchema[TKey]>,
  TChangeFn extends (...args: any[]) => TValue = (
    e: ChangeEvent<HTMLElement>
  ) => TValue,
>(
  ctx: UseFieldCtx<TSchema>,
  name: TKey,
  options?: UseFieldOptions<TChangeFn, TSchema>
) => FieldProps<TValue, TChangeFn>

const defaultIsEqual = (a: unknown, b: unknown) => a === b

const useField: UseField = (ctx, name, options = {}) => {
  const {
    schema,
    formValues,
    isDirty,
    getValue,
    getError,
    setTouched,
    setDiff,
    isTouched,
    getUpstreamValue,
    formatErrorMessage,
    defaultShowValidationOn,
    defaultUntouchOn,
  } = ctx

  const {
    disabled = false,
    showValidationOn = defaultShowValidationOn,
    unTouchOn = defaultUntouchOn,
    parseValue,
    disabledIf,
    isEqual = defaultIsEqual,
  } = options

  const touched = isTouched(name)
  const upstreamValue = getUpstreamValue(name)

  const onChange: any = (...args: any[]) => {
    const value = parseValue
      ? parseValue(...args)
      : ((args[0] as ChangeEvent<HTMLInputElement>).target.value as any)

    if (isEqual(value, upstreamValue)) {
      setDiff((prev) => ({ ...prev, [name]: undefined }))
    } else {
      setDiff((prev) => ({ ...prev, [name]: value }))
    }

    if (unTouchOn === 'change') {
      setTouched(name, false)
    }
  }

  const onFocus = () => {
    if (unTouchOn === 'focus') {
      setTouched(name, false)
    }
  }

  const onBlur = () => setTouched(name, true)

  const dirty = isDirty(name)
  const error = getError(name)
  const valid = !error

  const errorMessage = (() => {
    if (!error) return undefined
    if (showValidationOn === 'touched' && !touched) return undefined
    return formatErrorMessage(error!, name)
  })()

  const inputProps: FieldInputProps<typeof onChange> = {
    value: getValue(name),
    disabled: disabled ? true : (disabledIf?.(formValues) ?? false),
    required: !schema.shape[name].isOptional(),
    name: name as string,
    'data-valid': valid,
    onChange,
    onBlur,
    onFocus,
  }

  return {
    inputProps,
    upstreamValue,
    disabled,
    touched,
    dirty,
    valid,
    errorMessage,
  }
}

export default useField
