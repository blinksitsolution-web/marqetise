export function LegalNotice({ children }) {
  return (
    <p className="text-sm leading-6 text-muted">
      {children ? <>{children} </> : null}
      <a className="font-semibold text-blue" href="/privacy">Privacy Policy</a>
      {' and '}
      <a className="font-semibold text-blue" href="/terms">Terms of Service</a>.
    </p>
  )
}
