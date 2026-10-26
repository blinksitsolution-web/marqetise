import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import Swal from 'sweetalert2/dist/sweetalert2.esm.js'

window.matchMedia = window.matchMedia || function matchMedia(query) {
  return {
    matches: false,
    media: query,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() { return false },
  }
}

afterEach(() => {
  Swal.close()
})
