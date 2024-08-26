import { ChangeEvent } from 'react'
import { ZodRawShape, ZodError, ZodObject, z } from 'zod'

export type ShowValidationOn = 'touched' | 'always'
export type UntouchOn = 'focus' | 'change' | 'never'

type FieldInputProps<TChangeFn> = {
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

export type UseFieldOptions<TChangeFn> = {
  disabled?: boolean
  showValidationOn?: ShowValidationOn
  unTouchOn?: UntouchOn
  parseValue?: TChangeFn
  isEqual?: (a: unknown, b: unknown) => boolean
}

export type UseFieldCtx<TSchema extends ZodRawShape> = {
  schema: ZodObject<TSchema>
  isDirty: (fieldName: keyof TSchema) => boolean
  isTouched: (fieldName: keyof TSchema) => boolean
  getValue: (fieldName: keyof TSchema) => any
  setTouched: (fieldName: keyof TSchema, touched: boolean) => void
  getError: (fieldName: keyof TSchema) => ZodError | undefined
  getUpstreamValue: (fieldName: keyof TSchema) => any
  setDiff: React.Dispatch<
    React.SetStateAction<Partial<z.infer<ZodObject<TSchema>>>>
  >
  formatErrorMessage: (error: ZodError) => string
  defaultShowValidationOn: ShowValidationOn
  defaultUntouchOn: UntouchOn
}

const defaultIsEqual = (a: unknown, b: unknown) => a === b

export type UseField = <
  TSchema extends ZodRawShape,
  TKey extends keyof TSchema,
  TValue extends z.infer<TSchema[TKey]>,
  TChangeFn extends (...args: any[]) => TValue = (
    e: ChangeEvent<HTMLInputElement>
  ) => TValue,
>(
  ctx: UseFieldCtx<TSchema>,
  name: TKey,
  options?: UseFieldOptions<TChangeFn>
) => FieldProps<TValue, TChangeFn>

const useField: UseField = (ctx, name, options = {}) => {
  const {
    schema,
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
    return formatErrorMessage(error!)
  })()

  const inputProps: FieldInputProps<typeof onChange> = {
    value: getValue(name),
    disabled,
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
