import { SectionEditorPage } from './SectionEditorPage'
import { homeSections } from './homeSections'

const linkFields = [['label', 'Label'], ['href', 'Link']]

const chromeSection = {
  key: 'site.chrome',
  group: 'global',
  label: 'Header and footer',
  help: 'The menu, header button, footer links, and search box.',
  fields: [
    ['cta_label', 'Header button label', 'text'],
    ['cta_href', 'Header button link', 'text'],
    ['footer_explore_title', 'Footer links heading', 'text'],
    ['footer_contact_title', 'Footer contact heading', 'text'],
    ['search_placeholder', 'Search placeholder', 'text'],
    ['banner_image', 'Page banner image', 'image'],
  ],
  lists: [
    { key: 'nav', label: 'Menu', fields: linkFields },
    { key: 'footer_links', label: 'Footer links', fields: linkFields },
    { key: 'legal_links', label: 'Legal links', fields: linkFields },
  ],
}

const cardFields = [
  ['title', 'Heading', 'text'],
  ['body', 'Text', 'textarea'],
  ['image', 'Image', 'image'],
  ['image_alt', 'Image description', 'text'],
]

const aboutSections = [
  {
    key: 'about.banner',
    group: 'about',
    label: 'Banner',
    help: 'The first part of About: heading, a short line, and an image. Leave the line blank to hide it. The page summary is not printed here. Until an image is chosen, the template photo stays. Remove the image and save to hide it.',
    fields: [
      ['heading', 'Heading', 'text'],
      ['text', 'Short line', 'textarea'],
      ['image', 'Image', 'image'],
      ['image_alt', 'Image description', 'text'],
    ],
  },
  {
    key: 'about.who',
    group: 'about',
    label: 'Who we are card',
    help: 'The card that already has the photos. Its heading, text, points, and main image are saved here.',
    fields: cardFields,
    items: [['title', 'Point'], ['body', 'Text', 'textarea']],
  },
  {
    key: 'about.story',
    group: 'about',
    label: 'Our story',
    help: 'Its own card, in the same layout as Who we are.',
    fields: cardFields,
  },
  {
    key: 'about.priorities',
    group: 'about',
    label: 'Our priorities',
    help: 'Its own card, in the same layout as Who we are.',
    fields: cardFields,
  },
  {
    key: 'about.direction',
    group: 'about',
    label: 'Ambition, vision, mission',
    help: 'One card for the long-term ambition, vision, mission, and brand positioning.',
    fields: cardFields,
    items: [['title', 'Part'], ['body', 'Text', 'textarea']],
  },
  {
    key: 'about.values',
    group: 'about',
    label: 'Core values',
    help: 'All of the values on one card, in the same layout as Who we are.',
    fields: cardFields,
    items: [['title', 'Value'], ['body', 'Text', 'textarea']],
  },
  {
    key: 'about.extra',
    group: 'about',
    label: 'Other sections',
    help: 'Any other About section, each on its own card.',
    itemsLabel: 'Cards',
    items: [['title', 'Heading'], ['body', 'Text', 'textarea'], ['image', 'Image', 'image'], ['image_alt', 'Image description', 'text']],
  },
  {
    key: 'about.identity',
    group: 'about',
    label: 'Side panel',
    help: 'Shown in the side panel. It is not the Who we are card.',
    fields: [
      ['title', 'Heading', 'text'],
      ['body', 'Text', 'textarea'],
      ['mission', 'Mission', 'textarea'],
      ['vision', 'Vision', 'textarea'],
    ],
    itemsKey: 'values',
    itemsLabel: 'Values',
    items: [['title', 'Value'], ['body', 'Text', 'textarea']],
  },
  {
    key: 'about.approach',
    group: 'about',
    label: 'Approach',
    help: 'The steps under the introduction.',
    title: true,
    fields: [['intro', 'Intro', 'textarea']],
    items: [['title', 'Step'], ['body', 'Text', 'textarea']],
  },
]

const coursesSections = [
  {
    key: 'courses.hero',
    group: 'courses',
    label: 'Courses heading',
    help: 'The heading above the course list. Each course is edited under Courses.',
    fields: [
      ['headline', 'Heading', 'text'],
      ['subcopy', 'Intro', 'textarea'],
    ],
  },
]

const servicesSections = [
  {
    key: 'services.hero',
    group: 'services',
    label: 'Services intro',
    help: 'Optional heading above the service cards. Edit each card from All content, on the Services tab.',
    fields: [
      ['title', 'Heading', 'text'],
      ['intro', 'Intro', 'textarea'],
    ],
  },
]

const contactSections = [
  {
    key: 'contact.hero',
    group: 'contact',
    label: 'Contact intro',
    fields: [
      ['headline', 'Heading', 'text'],
      ['subcopy', 'Text', 'textarea'],
    ],
  },
  {
    key: 'contact.form',
    group: 'contact',
    label: 'Form labels',
    help: 'Labels on the contact form and the home enquiry form. The privacy and terms links stay on the page.',
    fields: [
      ['name_label', 'Contact name', 'text'],
      ['email_label', 'Contact email', 'text'],
      ['subject_label', 'Contact subject', 'text'],
      ['message_label', 'Contact message', 'text'],
      ['phone_label', 'Contact phone', 'text'],
      ['button_label', 'Contact button', 'text'],
      ['home_name_label', 'Home name', 'text'],
      ['home_email_label', 'Home email', 'text'],
      ['home_subject_label', 'Home subject', 'text'],
      ['home_message_label', 'Home message', 'text'],
      ['home_button_label', 'Home button', 'text'],
      ['home_consent', 'Home consent', 'textarea'],
    ],
  },
]

const bookSections = [
  {
    key: 'book.hero',
    group: 'book',
    label: 'Booking intro',
    fields: [
      ['title', 'Page heading', 'text'],
      ['eyebrow', 'Small label', 'text'],
      ['headline', 'Heading', 'text'],
      ['subcopy', 'Text', 'textarea'],
    ],
  },
]

const faqSections = [
  {
    key: 'faq.hero',
    group: 'faq',
    label: 'FAQ intro',
    help: 'Questions and answers are edited under CMS, FAQs.',
    fields: [
      ['title', 'Heading', 'text'],
      ['intro', 'Intro', 'textarea'],
    ],
  },
]

const packageSections = [
  {
    key: 'packages.plans',
    group: 'packages',
    label: 'Packages',
    help: 'Hidden until a plan is published. Leave this empty rather than adding a placeholder price.',
    fields: [
      ['title', 'Heading', 'text'],
      ['intro', 'Intro', 'textarea'],
    ],
    items: [['name', 'Name'], ['price', 'Price'], ['summary', 'Summary', 'textarea'], ['href', 'Link'], ['button', 'Button label']],
  },
]

function sectionByKey(key) {
  const section = homeSections.find((item) => item.key === key)
  return { ...section, group: 'home' }
}

const projectSections = [sectionByKey('home.projects')]
const teamSections = [sectionByKey('home.team')]
const newsSections = [sectionByKey('home.news')]
const testimonialSections = [sectionByKey('home.testimonials')]
const chromeSections = [chromeSection]

const legalSections = []

export function AboutEditorPage() {
  return <SectionEditorPage title="About page" seoPath="/admin/cms/about" liveHref="/about" pageSlug="about" sections={aboutSections} navLabel="About sections" pageHelp="The banner is the heading, short line, and image. The sections below it are cards: Who we are keeps its photos, and the other sections use that same card. The summary stays in the CMS and is not shown on the banner. The side panel is separate from the cards." />
}

export function CoursesPageEditor() {
  return <SectionEditorPage title="Courses page" seoPath="/admin/cms/courses" liveHref="/courses" pageSlug="courses" sections={coursesSections} navLabel="Courses sections" pageHelp="Published courses are listed under this heading." />
}

export function ServicesPageEditor() {
  return <SectionEditorPage title="Services page" seoPath="/admin/cms/services" liveHref="/services" pageSlug="services" sections={servicesSections} navLabel="Services sections" pageHelp="Published services are listed on this page." />
}

export function ContactEditorPage() {
  return <SectionEditorPage title="Contact page" seoPath="/admin/cms/contact" liveHref="/contact" pageSlug="contact" sections={contactSections} navLabel="Contact sections" />
}

export function BookEditorPage() {
  return <SectionEditorPage title="Booking page" seoPath="/admin/cms/book" liveHref="/book" sections={bookSections} navLabel="Booking sections" />
}

export function FaqEditorPage() {
  return <SectionEditorPage title="FAQ page" seoPath="/admin/cms/faq" liveHref="/faq" pageSlug="faq" sections={faqSections} navLabel="FAQ sections" pageHelp="The questions themselves are edited on the FAQs tab." />
}

export function ProjectsEditorPage() {
  return <SectionEditorPage title="Projects page" seoPath="/admin/cms/projects" liveHref="/projects" pageSlug="projects" sections={projectSections} navLabel="Projects sections" pageHelp="The list stays hidden until it is shown and has items." />
}

export function TeamEditorPage() {
  return <SectionEditorPage title="Team page" seoPath="/admin/cms/team" liveHref="/team" pageSlug="team" sections={teamSections} navLabel="Team sections" pageHelp="People stay hidden until the list is shown." />
}

export function NewsEditorPage() {
  return <SectionEditorPage title="News page" seoPath="/admin/cms/news" liveHref="/news" pageSlug="news" sections={newsSections} navLabel="News sections" pageHelp="Posts stay hidden until the list is shown." />
}

export function TestimonialsEditorPage() {
  return <SectionEditorPage title="Testimonials page" seoPath="/admin/cms/testimonials" liveHref="/testimonial" pageSlug="testimonials" sections={testimonialSections} navLabel="Testimonial sections" pageHelp="Quotes stay hidden until you have permission to publish them." />
}

export function PackagesEditorPage() {
  return <SectionEditorPage title="Packages page" seoPath="/admin/cms/packages" liveHref="/pricing" pageSlug="packages" sections={packageSections} navLabel="Package sections" />
}

export function ChromeEditorPage() {
  return <SectionEditorPage title="Header and footer" seoPath="/admin/cms/chrome" liveHref="/" sections={chromeSections} navLabel="Header and footer" />
}

export function PrivacyEditorPage() {
  return <SectionEditorPage title="Privacy" seoPath="/admin/cms/privacy" liveHref="/privacy" pageSlug="privacy" sections={legalSections} navLabel="Privacy" pageHelp="The heading and body are the privacy notice." />
}

export function TermsEditorPage() {
  return <SectionEditorPage title="Terms" seoPath="/admin/cms/terms" liveHref="/terms" pageSlug="terms" sections={legalSections} navLabel="Terms" pageHelp="The heading and body are the terms of service." />
}
