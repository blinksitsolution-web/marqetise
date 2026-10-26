import Swal from 'sweetalert2/dist/sweetalert2.esm.js'
import 'sweetalert2/dist/sweetalert2.css'
import './saveAlert.css'

const dialog = {
  buttonsStyling: false,
  focusConfirm: true,
  heightAuto: false,
  returnFocus: true,
  confirmButtonText: 'OK',
  customClass: {
    popup: 'mq-swal',
    title: 'mq-swal-title',
    htmlContainer: 'mq-swal-text',
    confirmButton: 'mq-swal-ok',
  },
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]))
}

export function savedAlert() {
  return Swal.fire({
    ...dialog,
    title: 'Saved',
    text: 'Your changes are live.',
    icon: 'success',
  })
}

export function saveErrorAlert(lines) {
  const items = (lines.length ? lines : ['The changes were not saved.'])
    .map((line) => `<li>${escapeHtml(line)}</li>`)
    .join('')
  return Swal.fire({
    ...dialog,
    title: lines.length > 1 ? 'Some changes were not saved' : 'Not saved',
    html: `<ul class="mq-swal-list">${items}</ul>`,
    icon: 'error',
  })
}
