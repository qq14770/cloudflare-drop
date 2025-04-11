import { Layout } from '../../components'

interface AdminProps {
  setBackdropOpen?: (open: boolean) => void
}

function AdminMain(props: AdminProps) {
  const setBackdropOpen = props.setBackdropOpen!

  const click = () => {
    setBackdropOpen(true)

    setTimeout(() => {
      setBackdropOpen(false)
    }, 4000)
  }
  return <div onClick={click}>aba</div>
}

export function Admin() {
  return (
    <Layout>
      <AdminMain />
    </Layout>
  )
}
