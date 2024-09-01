# Blitzform

A powerful and extensible React form management framework focused on dynamic behavior. With diff-based change tracking and baked in [zod](https://zod.dev) validation. Blitzform handles form state, behavior, and validation, while you retain full control over the markup.
<br />
Implement features like displaying the "Save" button only when the form is modified and valid, or showing error messages contextually based on user interaction. [See live](https://rosenthaljacob.github.io/blitzform/)

<img alt="npm version" src="https://badge.fury.io/js/blitzform.svg"> <img alt="npm downloads" src="https://img.shields.io/npm/dm/blitzform.svg"> <a href="https://bundlephobia.com/result?p=blitzform@latest"><img alt="Bundlephobia" src="https://img.shields.io/bundlephobia/minzip/blitzform.svg"></a>

## Installation

```sh
# npm
npm i --save blitzform
# yarn
yarn add blitzform
# pnpm
pnpm add blitzform
```

## The Gist

```tsx
import * as React from 'react'
import { useForm } from 'blitzform'
import { z, ZodError } from 'zod'

// create our schema with validation included
const Z_RegisterInput = z.object({
  name: z.string().optional(),
  email: z.string().email(),
  // we can also pass custom messages as a second parameter
  password: z
    .string()
    .min(8, { message: 'Your password next to have at least 8 characters.' }),
})

type T_RegisterInput = z.infer<typeof Z_RegisterInput>

function Form() {
  // we create a form by passing the schema
  const { useField, handleSubmit, formProps, reset, touchAll } = useForm(
    Z_RegisterInput,
    // pass an upstream/initial value, the hook will only store modified (dirty) values
    {
      name: '',
      email: '',
      password: '',
    }
  )

  // now we can create our fields for each property
  // the field controls the state and validation per property
  const name = useField('name')
  const email = useField('email')
  const password = useField('password')

  function onSuccess(data: T_RegisterInput) {
    // do something with the safely parsed data
    console.log(data)
    // reset the form to the upstream/initial state
    reset()
  }

  function onFailure(error: ZodError) {
    touchAll()
    console.error(error)
  }

  return (
    <form
      {...formProps}
      onSubmit={(e) => {
        e.preventDefault()
        handleSubmit(onSuccess, onFailure)
      }}>
      <label htmlFor="name">Full Name</label>
      <input id="name" {...name.inputProps} />

      <label htmlFor="email">E-Mail</label>
      <input id="email" type="email" {...email.inputProps} />
      <p style={{ color: 'red' }}>{email.errorMessage}</p>

      <label htmlFor="password">Password</label>
      <input id="password" type="password" {...password.inputProps} />
      <p style={{ color: 'red' }}>{password.errorMessage}</p>

      <button type="submit">Login</button>
    </form>
  )
}
```

> **Note**: This is a simple example. You can easily modify behaviors and integrate custom components.

## Advanced Example

[See live](https://rosenthaljacob.github.io/blitzform/)

This section demonstrates a more sophisticated form setup using `blitzform`.

- Dynamic form behavior is controlled through `formDirty` and `formValid`, ensuring the submit button only enables when the form has changes and passes validation.
- Show error messages only after inputs lose focus, and hide them when focused again.
- By using BlitzformProvider, we decouple state management from form components. This allows you to create a library of self-managed components.
- We create reusable `BlitzTextField` and `BlitzSelect` components that can be dropped into any form using the library.

```tsx
import React from 'react'
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
import { useForm, useBlitzField, BlitzformProvider } from 'blitzform'
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
  const field = useBlitzField(name)

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
  const field = useBlitzField(name, {
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

  const labelId = `blitz-select-${name}`

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
}
```

## API Reference

### useForm

The core API that connects the form with a zod schema and returns a set of helpers to manage the state and render the actual markup.

| Parameter    | Type                                | Default               | Description                                                   |
| ------------ | ----------------------------------- | --------------------- | ------------------------------------------------------------- |
| schema       | ZodObject                           |                       | A valid zod object schema                                     |
| upstreamData | Partial<z.infer<ZodObject<schema>>> |                       | The upstream value, useForm only stores diffs from this value |
| config       | [Config](#config)                   | See [Config](#config) | Additional config options                                     |

```ts
import { z } from 'zod'

const Z_Input = z.object({
  name: z.string().optional(),
  email: z.string().email(),
  // we can also pass custom messages as a second parameter
  password: z
    .string()
    .min(8, { message: 'Your password next to have at least 8 characters.' }),
})

type T_Input = z.infer<typeof Z_Input>

// usage inside react components
const const { useField, handleSubmit, formProps, reset, touchAll } = useForm(Z_Input, {})
```

#### Config

| Parameter               | Type                                                   | Default                                                  | Description                                                                                                                                                                                                                         |
| ----------------------- | ------------------------------------------------------ | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| formatErrorMessage      | `(error: ZodIssue, name: string) => string`            | `(error) => error.errors?.[0]?.message ?? error.message` | Customizes error messages. This formatter processes the raw zod issue to create a more localized or user friendly message.                                                                                                          |
| isEqual                 | `<Record<keyof TSchema, (a: any, b: any) => boolean>>` | `{}`                                                     | Allows deep equality checks for specific fields. Useful when working with arrays, objects, or custom data structures where the default `===` comparison may not be sufficient. Example: Compare sorted arrays for equality.         |
| initTouched             | `boolean` \| `Record<keyof TSchema, boolean>`          | `false`                                                  | Specifies the initial touched state of fields. Set to `true` to touch all fields by default, or provide an object to touch specific fields. This is beneficial for pre-filled forms where validation should be immediately visible. |
| defaultShowValidationOn | `touched` \| `always`                                  | `touched`                                                | Determines when to display validation errors. Choose between showing errors when a field is touched or always showing them.                                                                                                         |
| defaultUntouchOn        | `focus` \| `change` \| `never`                         | `focus`                                                  | Controls when a field should be marked as untouched, allowing you to reset validation states on focus, change, or never.                                                                                                            |

#### formatErrorMessage

The preferred way to handle custom error messages would be to add them to the schema directly.<br />
In some cases e.g. when receiving the schema from an API or when having to localise the error, we can leverage this helper.

```ts
import { ZodIssue } from 'zod'

// Note: the type is ZodIssue and not ZodError since we always only show the first error
function formatErrorMessage(error: ZodIssue, name: string) {
  switch (error.code) {
    case 'too_small':
      return `This field ${name} requires at least ${error.minimum} characters.`
    default:
      return error.message
  }
}
```

#### isEqual

An object where deep equal checks can be defined for specific fields. This can be used when the default `(a, b) => a === b` check is not sufficient, such as when handling arrays or objects.

```ts
const { handleSubmit, touchAll, formProps, reset, formDirty, formValid } =
  useForm(
    schema,
    {},
    {
      isEqual: {
        permissions: (a, b) =>
          [...a].sort().join(',') === [...b].sort().join(','),
      },
    }
  )
```

### useField

The `useField` hook manages the state, validation, and interaction of individual form fields. It returns a set of HTML attributes and properties to connect the field to form elements while handling error management, touch state, and dynamic behavior.

| Parameter | Type                           | Default               | Description                                                 |
| --------- | ------------------------------ | --------------------- | ----------------------------------------------------------- |
| name      | `keyof z.infer<typeof schema>` |                       | The name of the schema property that this field connects to |
| config    | [Config](#config)              | See [Config](#config) | Initial field data and additional config options            |

#### Config

| Property         | Type                                  | Default                 | Description                                                                                                                                                 |
| ---------------- | ------------------------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| disabled         | `boolean`                             | `false`                 | Disables the field when true.                                                                                                                               |
| disabledIf       | `(formState: TSchema) => boolean`     | `undefined`             | Dynamically disables the field based on the current form state.                                                                                             |
| showValidationOn | `"touched"` \| `"always"`             | `"touched"`             | Specifies when validation errors are displayed—either after the field is touched or continuously.                                                           |
| unTouchOn        | `"focus"` \| `"change"` \| `"never"`  | `"focus"`               | Configures when the field should be marked as untouched. This option can reset validation states based on focus, change, or be disabled entirely (`never`). |
| parseValue       | `(Event) => any`                      | `(e) => e.target.value` | Parses the value from the event before storing it in the field state. Useful for custom inputs like checkboxes or non-string values.                        |
| isEqual          | `(a: unknown, b: unknown) => boolean` | `(a, b) => a === b`     | Provides a custom comparison function to determine whether the field value has changed from its upstream value, crucial for complex data structures.        |

#### disabledIf

The `disabledIf` option allows you to dynamically disable a field based on the current form state. This is particularly useful for conditional fields that depend on other form values.

```ts
const { inputProps, errorMessage, dirty, valid, touched, disabled } = useField(
  'email',
  {
    disabledIf: (formState) => formState.role === 'admin',
  }
)
```

#### inputProps

Pass these to native HTML `input`, `select` and `textarea` elements.<br />
Use `data-valid` to style the element based on the validation state.

```ts
export type FieldInputProps<TChangeFn> = {
  value: any
  disabled: boolean
  required: boolean
  name: string
  'data-valid': boolean
  onChange: TChangeFn // Default: (e: ChangeEvent<HTMLElement>) => string unless specified otherwise
  onBlur: () => void
  onFocus: () => void
}
```

#### errorMessage

A string containing the validation message. Returns undefined according to if the field is valid, touched and the `showValidationOn` setting.

### handleSubmit

It validates form data using the zod schema. You will likely want to prevent the default form behavior by calling `e.preventDefault()` as shown below.

| Parameter | Type                             | Description                                        |
| --------- | -------------------------------- | -------------------------------------------------- |
| onSuccess | `(data: z.infer<typeof schema>)` | Callback on successful safe parse of the form data |
| onFailure | `(error: ZodError)`              | Callback on failed safe parse                      |

```ts
import { ZodError } from 'zod'

function onSuccess(data: TInput) {
  console.log(data)
}

function onFailure(error: ZodError) {
  console.error(error)
}

// <form> onSubmit handler
const onSubmit = (e) => {
  e.preventDefault()
  handleSubmit(onSuccess, onFailure)
}
```

### isDirty

Returns whether the form is dirty, meaning that any of the fields was altered compared to their initial state.<br />
Useful e.g. when conditionally showing a save button or when you want to inform a user that they're closing a modal with unsaved changes.

### formProps

An object that contains props that are passed to the native `<form>` element.
Currently only consists of a single prop:

```ts
const formProps = {
  noValidate: true,
}
```

## BlitzformProvider

The `BlitzformProvider` component allows you to decouple the form state management from the parent component. This context can be used by the `useBlitzField` hook to connect to the form state.

The component takes a single prop `ctx` which carries the form context.

```tsx
function Form() {
  const { ctx } = useForm(schema, {})

  return (
    <BlitzformProvider ctx={ctx}>
      <BlitzTextField name="firstName" label="First Name" />
    </BlitzformProvider>
  )
}
```

### useBlitzField

Can be used only inside a `BlitzformProvider` component. It is similar to `useField` although does not share the schema types.

```tsx
import { TextField, FormControl } from '@mui/material'
import { useBlitzField } from 'blitzform'

function BlitzTextField({
  name,
  label,
  type = 'text',
}: {
  name: string
  label: string
  type?: string
}) {
  const field = useBlitzField(name)

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
```

## About This Fork

This package was forked from [react-controlled-form](https://github.com/robinweser/react-controlled-form) by [@robinweser](http://weser.io).
<br>
Adapted and maintained by [Jacob Rosenthal](https://github.com/rosenthaljacob).

## License

Blitzform is licensed under the [MIT License](http://opensource.org/licenses/MIT).<br>
Documentation is licensed under [Creative Common License](http://creativecommons.org/licenses/by/4.0/).
