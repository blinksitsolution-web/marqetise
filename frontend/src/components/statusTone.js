export function statusTone(status) {
  if (['published', 'active', 'confirmed', 'resolved', 'completed'].includes(status)) return 'green'
  if (['pending', 'invited', 'in_progress', 'waitlist', 'draft'].includes(status)) return 'orange'
  if (['suspended', 'cancelled', 'withdrawn', 'archived'].includes(status)) return 'red'
  return 'blue'
}
