import { createContext, useContext, type PropsWithChildren } from 'react'
import { ZodRawShape } from 'zod'
import useField_internal, {
  type UseFieldCtx,
  type UseFieldOptions,
  type FieldProps,
} from './useField_internal'

const BlitzformContext = createContext<UseFieldCtx<ZodRawShape> | undefined>(
  undefined
)

export function BlitzformProvider({
  children,
  ctx,
}: PropsWithChildren<{ ctx: UseFieldCtx<any> }>) {
  return (
    <BlitzformContext.Provider value={ctx}>
      {children}
    </BlitzformContext.Provider>
  )
}

export function useField<TChangeFn extends (...args: any[]) => any>(
  name: string,
  options?: UseFieldOptions<TChangeFn>
): FieldProps<ReturnType<TChangeFn>, TChangeFn> {
  const ctx = useContext(BlitzformContext)
  if (!ctx) {
    throw new Error('useBlitzformField must be used within a BlitzformProvider')
  }
  return useField_internal(ctx, name, options)
}
