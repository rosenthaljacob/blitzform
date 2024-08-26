import { useState } from 'react'

import EditUser, { UserType } from './edit-user'
import EditUserCode from './edit-user-code'

function App() {
  const [user, setUser] = useState<UserType>({
    firstName: 'John',
    lastName: 'Doe',
    email: 'johndoe@example.com',
    permissions: ['Read'],
  })

  return (
    <>
      <EditUser data={user} setData={setUser} />
      <EditUserCode />
    </>
  )
}

export default App
