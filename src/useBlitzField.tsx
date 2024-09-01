import { createContext, useContext, type PropsWithChildren } from 'react'
import { ZodRawShape } from 'zod'
import useField, {
  type UseFieldCtx,
  type UseFieldOptions,
  type FieldProps,
} from './useField'

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

export function useBlitzField<TChangeFn extends (...args: any[]) => any>(
  name: string,
  options?: UseFieldOptions<TChangeFn>
): FieldProps<ReturnType<TChangeFn>, TChangeFn> {
  const ctx = useContext(BlitzformContext)
  if (!ctx) {
    throw new Error('useBlitzformField must be used within a BlitzformProvider')
  }
  return useField(ctx, name, options)
}
