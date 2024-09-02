import { Container, Box } from '@mui/material'
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vs2015 } from 'react-syntax-highlighter/dist/esm/styles/hljs' // or any other theme
import javascript from 'react-syntax-highlighter/dist/esm/languages/hljs/javascript'

SyntaxHighlighter.registerLanguage('javascript', javascript)

const codeString = `import React from 'react'
import {
  Container,
  TextField,
  Button,
  MenuItem,
  FormControl,
  FormHelperText,
  Select,
  InputLabel,
  Stack,
} from '@mui/material'
import { useForm, useField, BlitzformProvider } from 'blitzform'
import { z } from 'zod'

const userFormSchema = z.object({
  firstName: z.string().min(1, { message: 'First name is required' }),
  lastName: z.string().min(1, { message: 'Last name is required' }),
  email: z.string().email({ message: 'Invalid email address' }),
  permissions: z
    .array(z.string())
    .min(1, { message: 'Please select at least one permission' }),
})

export type UserType = z.infer<typeof userFormSchema>

const permissionsOptions = ['Read', 'Write', 'Delete', 'Admin']

export default function EditUser({
  data,
  setData,
}: {
  data: UserType
  setData: (data: UserType) => void
}) {
  const {
    ctx,
    handleSubmit,
    touchAll,
    formProps,
    reset,
    formDirty,
    formValid,
  } = useForm(
    userFormSchema,
    // pass the upstream/initial value, the hook will only store modified (dirty) values
    data,
    {
      defaultUntouchOn: 'focus', // untouch fields on focus
      initTouched: true, // mark all fields as touched initially
    }
  )

  function handleSubmitSuccess(data: UserType) {
    setData(data) // update upstream data
    reset() // this will clear the useForm diff and the form will show the upstream data
  }

  function handleSubmitError(error: z.ZodError) {
    touchAll() // mark all fields as touched to display validation errors
    console.log('Error:', error)
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    handleSubmit(handleSubmitSuccess, handleSubmitError)
  }

  return (
    <Container maxWidth="sm">
      <h2>Edit User</h2>
      {/* BlitzformProvider passes the form context to child components */}
      <BlitzformProvider ctx={ctx}>
        <form {...formProps} onSubmit={onSubmit}>
          <Stack spacing={2.5}>
            <BlitzTextField name="firstName" label="First Name" />

            <BlitzTextField name="lastName" label="Last Name" />

            <BlitzTextField name="email" label="Email" type="email" />

            <BlitzSelect name="permissions" label="Permissions" multiple>
              {permissionsOptions.map((permission) => (
                <MenuItem key={permission} value={permission}>
                  {permission}
                </MenuItem>
              ))}
            </BlitzSelect>

            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={!formDirty || !formValid} // button disabled if the form is not modified or invalid
            >
              Save
            </Button>
          </Stack>
        </form>
      </BlitzformProvider>
    </Container>
  )
}

// reusable input field for use inside the BlitzformProvider
function BlitzTextField({
  name,
  label,
  type = 'text',
}: {
  name: string
  label: string
  type?: string
}) {
  // connect the input to the form state
  const field = useField(name)

  return (
    <FormControl fullWidth>
      <TextField
        {...field.inputProps}
        type={type}
        label={label}
        error={!!field.errorMessage}
        helperText={field.errorMessage}
      />
    </FormControl>
  )
}

// Reusable Select component integrated with Blitzform
function BlitzSelect({
  name,
  label,
  multiple,
  children,
}: {
  name: string
  label: string
  multiple?: boolean
  children: React.ReactNode
}) {
  const field = useField(name, {
    // custom parseValue function since default is (e) => e.target.value
    parseValue: (v) => v,
    // custom isEqual function to compare new value to upstream value
    isEqual: (a, b) => {
      if (Array.isArray(a) && Array.isArray(b)) {
        return [...a].sort().join(',') === [...b].sort().join(',')
      }
      return a === b
    },
  })

  const labelId = \`blitz-select-\${name}\`

  return (
    <FormControl fullWidth error={!!field.errorMessage}>
      <InputLabel id={labelId}>{label}</InputLabel>
      <Select
        {...field.inputProps}
        labelId={labelId}
        label={label}
        multiple={multiple}
        value={field.inputProps.value}
        onChange={(e) => {
          const value = e.target.value as string | string[]
          field.inputProps.onChange(value)
        }}>
        {children}
      </Select>
      {field.errorMessage && (
        <FormHelperText>{field.errorMessage}</FormHelperText>
      )}
    </FormControl>
  )
}`

export default function EditUserCode() {
  return (
    <Container sx={{ mt: 4 }}>
      <h2>Code</h2>
      <Box my={2}>
        <SyntaxHighlighter
          customStyle={{
            fontSize: '0.75rem',
            padding: '1.5rem',
          }}
          language="javascript"
          style={vs2015}>
          {codeString}
        </SyntaxHighlighter>
      </Box>
    </Container>
  )
}
