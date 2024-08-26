import {
  createContext,
  useContext,
  type ChangeEvent,
  type PropsWithChildren,
} from 'react'
import { ZodRawShape } from 'zod'
import useField, { type UseFieldCtx, type UseFieldOptions } from './useField'

const RcfFieldContext = createContext<UseFieldCtx<ZodRawShape> | undefined>(
  undefined
)

export function RcfFormProvider({
  children,
  ctx,
}: PropsWithChildren<{ ctx: UseFieldCtx<any> }>) {
  return (
    <RcfFieldContext.Provider value={ctx}>{children}</RcfFieldContext.Provider>
  )
}

export function useRcfField(name: string, options?: UseFieldOptions) {
  const ctx = useContext(RcfFieldContext)
  if (!ctx) {
    throw new Error('useRcfField must be used within a RcfFormProvider')
  }
  return useField(ctx, name, options)
}
