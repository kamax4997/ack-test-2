import React from 'react'
import { ToastProvider, useToasts } from 'react-toast-notifications'
import { Redirect } from 'react-router-dom'
import { LoginForm as Form } from './form'
import { useAuth } from './general'

const Login = () => {
  const { addToast } = useToasts()
  const auth = useAuth()
  const [redirect, setRedirect] = React.useState(false)

  if (redirect) {
    return (
      <Redirect
        to={{
          pathname: '/app',
          state: {
            welcome: true,
          },
        }}
      />
    )
  }

  return (
    <div className="flex h-screen w-screen justify-center items-center flex-col">
      <div className="flex items-center flex-shrink-0 px-4">
        {/* <img className="h-8 w-auto mb-4" src="#" alt="Workflow" /> */}
      </div>
      <h1 className="mb-4">Device Management Interface</h1>
      <Form
        callback={values =>
          auth.login(
            {
              ...values,
            },
            e => {
              if (e) {
                addToast('Wrong credentials', {
                  appearance: 'error',
                  autoDismiss: true,
                })
              } else {
                setRedirect(true)
              }
            },
          )
        }
      />
    </div>
  )
}
const ToastLogin = () => (
  <ToastProvider>
    <Login />
  </ToastProvider>
)
export default ToastLogin
