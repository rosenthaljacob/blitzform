import { useState } from 'react'
import { z, ZodObject, ZodError, ZodRawShape } from 'zod'
import useField, {
  UseFieldCtx,
  UseFieldOptions,
  ShowValidationOn,
  UntouchOn,
} from './useField'

export type FormHandleSubmit<TSchema extends ZodRawShape> = (
  onSubmit: (data: z.infer<ZodObject<TSchema>>) => void,
  onError?: (error: ZodError) => void
) => void

export type UseFormConfig<TSchema extends ZodRawShape> = {
  formatErrorMessage?: (error: ZodError) => string
  isEqual?: Partial<Record<keyof TSchema, (a: any, b: any) => boolean>>
  initTouched?: Partial<Record<keyof TSchema, boolean>> | boolean
  defaultShowValidationOn?: ShowValidationOn
  defaultUntouchOn?: UntouchOn
}

const defaultFormatErrorMessage = (error: ZodError) =>
  error.errors[0]?.message ?? error.message

export const useForm = <TSchema extends ZodRawShape>(
  schema: ZodObject<TSchema>,
  upstreamData: Partial<z.infer<ZodObject<TSchema>>> = {},
  config: UseFormConfig<TSchema> = {}
) => {
  type TFieldName = keyof typeof schema.shape

  const {
    defaultShowValidationOn = 'touched',
    defaultUntouchOn = 'focus',
    formatErrorMessage = defaultFormatErrorMessage,
  } = config

  const initTouched = Object.keys(schema.shape).reduce(
    (acc, key: TFieldName) => {
      acc[key] =
        typeof config.initTouched === 'boolean'
          ? config.initTouched
          : (config.initTouched?.[key] ?? false)
      return acc
    },
    {} as Record<TFieldName, boolean>
  )

  const [diff, setDiff] = useState<Partial<z.infer<typeof schema>>>({})
  const [touchedFields, setTouchedFields] =
    useState<Record<TFieldName, boolean>>(initTouched)

  const isTouched = (fieldName: TFieldName) => !!touchedFields[fieldName]
  const setTouched = (fieldName: TFieldName, touched: boolean) => {
    setTouchedFields((prev) => ({
      ...prev,
      [fieldName]: touched,
    }))
  }

  const touchAll = () => {
    setTouchedFields(
      Object.keys(schema.shape).reduce(
        (acc, key: TFieldName) => {
          acc[key] = true
          return acc
        },
        {} as Record<TFieldName, boolean>
      )
    )
  }

  const isDiff = (fieldName: TFieldName) => {
    return diff[fieldName] !== undefined
  }

  const getUpstreamValue = (fieldName: TFieldName) => upstreamData[fieldName]

  const getValue = (fieldName: TFieldName) =>
    diff[fieldName] ?? getUpstreamValue(fieldName)

  const dirtyFieldsArray = (Object.keys(schema.shape) as TFieldName[]).filter(
    isDiff
  )

  const fieldErrors = (Object.keys(schema.shape) as TFieldName[]).reduce(
    (acc, key) => {
      const itemSchema = schema.shape[key]
      const result = itemSchema.safeParse(getValue(key))
      if (!result.success) {
        acc[key] = result.error
      }
      return acc
    },
    {} as Record<TFieldName, ZodError | undefined>
  )

  const getError = (fieldName: TFieldName) => fieldErrors[fieldName]

  const ctx: UseFieldCtx<typeof schema.shape> = {
    schema,
    isDirty: isDiff,
    isTouched,
    getValue,
    getError,
    getUpstreamValue,
    setDiff,
    setTouched,
    formatErrorMessage,
    defaultShowValidationOn,
    defaultUntouchOn,
  }

  const handleSubmit: FormHandleSubmit<typeof schema.shape> = (
    onSubmit,
    onError
  ) => {
    const fields = Object.keys(schema.shape).reduce(
      (acc, key: TFieldName) => {
        acc[key] = getValue(key)
        return acc
      },
      {} as Record<TFieldName, any>
    )

    const result = schema.safeParse(fields)

    if (result.success) {
      onSubmit(result.data)
      return
    }

    onError?.(result.error)
  }

  const reset = () => {
    setDiff({})
  }

  return {
    ctx,
    formProps: { noValidate: true as const },
    formDirty: dirtyFieldsArray.length > 0,
    reset,
    handleSubmit,
    touchAll,
    useField: <
      TName extends TFieldName,
      TChangeFn extends (
        ...args: any[]
      ) => z.infer<(typeof schema.shape)[TName]> = (
        e: React.ChangeEvent<HTMLInputElement>
      ) => z.infer<(typeof schema.shape)[TName]>,
    >(
      name: TName,
      options?: UseFieldOptions<TChangeFn>
    ) => useField(ctx, name, options),
  }
}
