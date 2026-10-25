export const homeSections = [
  {
    key: 'home.hero',
    label: 'Hero',
    help: 'The first screen: headline, buttons, and an optional image.',
    fields: [
      ['eyebrow', 'Small label', 'text'],
      ['headline', 'Headline', 'textarea'],
      ['subcopy', 'Supporting text', 'textarea'],
      ['primary_label', 'Primary button label', 'text'],
      ['primary_href', 'Primary button link', 'text'],
      ['secondary_label', 'Secondary button label', 'text'],
      ['secondary_href', 'Secondary button link', 'text'],
      ['proof', 'Proof line', 'text'],
      ['image', 'Hero image', 'image'],
      ['image_alt', 'Hero image description', 'text'],
    ],
  },
  {
    key: 'home.focus',
    label: 'Focus areas',
    help: 'Short points for what the team works on.',
    title: true,
    items: [['title', 'Title'], ['body', 'Text']],
  },
  {
    key: 'home.services',
    label: 'Services intro',
    help: 'Heading above published services. Edit each service under CMS, Services.',
    fields: [
      ['title', 'Heading', 'text'],
      ['intro', 'Intro', 'textarea'],
    ],
  },
  {
    key: 'home.why',
    label: 'Why Marqetise',
    help: 'The reasons section.',
    title: true,
    items: [['title', 'Title'], ['body', 'Text']],
  },
  {
    key: 'home.process',
    label: 'Process',
    help: 'The numbered steps.',
    title: true,
    items: [['title', 'Step title'], ['body', 'Text']],
  },
  {
    key: 'home.courses',
    label: 'Courses intro',
    help: 'Heading above featured courses. A course appears here when it is published and marked featured.',
    fields: [
      ['title', 'Heading', 'text'],
      ['intro', 'Intro', 'textarea'],
    ],
  },
  {
    key: 'home.stats',
    label: 'Stats',
    help: 'Leave this hidden until the figures are real.',
    title: true,
    items: [['value', 'Figure'], ['label', 'Label']],
  },
  {
    key: 'home.projects',
    label: 'Projects',
    help: 'Case studies. Hidden while the list is empty.',
    title: true,
    items: [['title', 'Title'], ['slug', 'Page address'], ['summary', 'Summary'], ['href', 'Link'], ['image', 'Image'], ['image_alt', 'Image description']],
  },
  {
    key: 'home.team',
    label: 'Team',
    help: 'People. Hidden while the list is empty.',
    title: true,
    items: [['name', 'Name'], ['slug', 'Page address'], ['role', 'Role'], ['bio', 'Short bio', 'textarea'], ['image', 'Photo'], ['image_alt', 'Photo description']],
  },
  {
    key: 'home.testimonials',
    label: 'Testimonials',
    help: 'Quotes you have permission to publish. Hidden while the list is empty.',
    title: true,
    items: [['quote', 'Quote'], ['name', 'Name'], ['role', 'Role']],
  },
  {
    key: 'home.partners',
    label: 'Partner logos',
    help: 'Logos. Hidden while the list is empty.',
    title: true,
    items: [['name', 'Name'], ['href', 'Link'], ['image', 'Logo'], ['image_alt', 'Logo description']],
  },
  {
    key: 'home.news',
    label: 'News',
    help: 'Posts. Hidden while the list is empty.',
    title: true,
    items: [['title', 'Title'], ['slug', 'Page address'], ['summary', 'Summary'], ['date', 'Date'], ['href', 'Link'], ['image', 'Image'], ['image_alt', 'Image description']],
  },
  {
    key: 'home.cta',
    label: 'Closing call to action',
    help: 'The band at the bottom of the home page.',
    fields: [
      ['title', 'Heading', 'textarea'],
      ['body', 'Text', 'textarea'],
      ['primary_label', 'Primary button label', 'text'],
      ['primary_href', 'Primary button link', 'text'],
      ['secondary_label', 'Secondary button label', 'text'],
      ['secondary_href', 'Secondary button link', 'text'],
      ['form_title', 'Enquiry form heading', 'text'],
    ],
  },
]

function blankRow(fields) {
  return Object.fromEntries(fields.map(([key]) => [key, '']))
}

export function blankPayload(section) {
  const payload = {}
  if (section.title) payload.title = ''
  for (const [key] of section.fields || []) payload[key] = ''
  if (section.items) payload[section.itemsKey || 'items'] = []
  for (const list of section.lists || []) payload[list.key] = []
  return payload
}

function rowsFor(raw, key, fields, mapRow) {
  const rows = Array.isArray(raw?.[key]) ? raw[key] : []
  return rows.map((item) => {
    const next = Object.fromEntries(fields.map(([field]) => [field, item?.[field] || '']))
    return mapRow ? mapRow(next, item) : next
  })
}

export function sectionPayload(section, raw) {
  const payload = { ...blankPayload(section), ...(raw || {}) }
  if (section.items) {
    const key = section.itemsKey || 'items'
    payload[key] = rowsFor(raw, key, section.items, section.key === 'home.testimonials'
      ? (next, item) => ({
        ...next,
        quote: item?.quote || item?.body || '',
        name: item?.name || item?.title || '',
        role: item?.role || '',
      })
      : null)
  }
  for (const list of section.lists || []) {
    payload[list.key] = rowsFor(raw, list.key, list.fields)
  }
  return payload
}

export function emptyItem(fields) {
  return blankRow(fields)
}
