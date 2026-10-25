import { useEffect, useState } from 'react'
import Seo from '../../components/Seo'
import { Notice, Spinner } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { api, can, ensureCsrf, errorMessage } from '../../services/api'

export function PermissionsPage() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  function load() {
    api.get('/api/v1/admin/roles').then((response) => setData(response.data.data))
  }

  useEffect(load, [])

  async function toggle(role, permissionId) {
    if (!can(user, 'roles.manage') || role.slug === 'super-admin') return
    const current = new Set(role.permissions.map((permission) => permission.id))
    if (current.has(permissionId)) current.delete(permissionId)
    else current.add(permissionId)
    setMessage('')
    setError('')
    try {
      await ensureCsrf()
      await api.put(`/api/v1/admin/roles/${role.id}`, {
        name: role.name,
        slug: role.slug,
        description: role.description,
        permission_ids: [...current],
      })
      setMessage('Permissions saved.')
    } catch (saveError) {
      setError(errorMessage(saveError, 'Permissions were not saved.'))
    }
    load()
  }

  if (!data) return <Spinner />
  const groups = [...new Set(data.permissions.map((permission) => permission.group))]

  return (
    <section>
      <Seo title="Permissions" path="/admin/permissions" robots="noindex,nofollow" />
      <h1 className="text-2xl font-semibold">Permissions</h1>
      <p className="mt-1 text-sm text-muted">The server rejects any action the signed-in role cannot perform. Hiding a button is not the control.</p>
      {message ? <div className="mt-4"><Notice tone="success">{message}</Notice></div> : null}
      {error ? <div className="mt-4"><Notice tone="error">{error}</Notice></div> : null}
      <div className="mt-4 space-y-3 md:hidden">
        {data.permissions.map((permission) => (
          <article key={permission.id} className="rounded-2xl bg-white p-4">
            <h2 className="font-semibold">{permission.name}</h2>
            <ul className="mt-2">
              {data.roles.map((role) => {
                const checked = role.slug === 'super-admin' || role.permissions.some((item) => item.id === permission.id)
                return (
                  <li key={role.id} className="flex min-h-11 items-center justify-between gap-3 text-sm">
                    <span>{role.name}</span>
                    <input type="checkbox" aria-label={`${role.name} ${permission.name}`} checked={checked} disabled={!can(user, 'roles.manage') || role.slug === 'super-admin'} onChange={() => toggle(role, permission.id)} />
                  </li>
                )
              })}
            </ul>
          </article>
        ))}
      </div>
      <div className="mt-4 hidden overflow-x-auto rounded-2xl bg-white md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-muted">
              <th className="px-4 py-3">Permission</th>
              {data.roles.map((role) => <th key={role.id} className="px-3 py-3">{role.name}</th>)}
            </tr>
          </thead>
          <tbody>
            {groups.flatMap((group) => [
                <tr key={`${group}-heading`}><td className="bg-surface px-4 py-2 text-xs font-semibold uppercase" colSpan={data.roles.length + 1}>{group}</td></tr>,
                ...data.permissions.filter((permission) => permission.group === group).map((permission) => (
                  <tr key={permission.id} className="border-t border-line">
                    <td className="px-4 py-2">{permission.name}</td>
                    {data.roles.map((role) => {
                      const checked = role.slug === 'super-admin' || role.permissions.some((item) => item.id === permission.id)
                      return (
                        <td key={role.id} className="px-3">
                          <input type="checkbox" aria-label={`${role.name} ${permission.name}`} checked={checked} disabled={!can(user, 'roles.manage') || role.slug === 'super-admin'} onChange={() => toggle(role, permission.id)} />
                        </td>
                      )
                    })}
                  </tr>
                )),
            ])}
          </tbody>
        </table>
      </div>
    </section>
  )
}

