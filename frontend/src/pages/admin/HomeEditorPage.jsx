import { SectionEditorPage } from './SectionEditorPage'
import { homeSections } from './homeSections'

export function HomeEditorPage() {
  return (
    <SectionEditorPage
      title="Home page"
      seoPath="/admin/cms/home"
      liveHref="/"
      sections={homeSections}
      pageSlug="home"
      pageHelp="The heading is used when the hero is hidden. The body sits under the hero."
      navLabel="Home sections"
    />
  )
}
