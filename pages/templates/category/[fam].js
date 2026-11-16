import { Category } from '../../../components/Tienda'
import { families, products, card } from '../../../lib/plantillas-data'
const LANG = 'en', OTHER = 'es'
export default function Page(props) { return <Category lang={LANG} {...props} /> }
export function getStaticPaths() { return { paths: families.map((f) => ({ params: { fam: f.slug[LANG] } })), fallback: false } }
export function getStaticProps({ params }) {
  const f = families.find((x) => x.slug[LANG] === params.fam)
  return { props: { altSlug: f.slug[OTHER], family: { id: f.id, slug: f.slug[LANG], name: f.name[LANG], summary: f.summary[LANG], items: products.filter((p) => p.family === f.id).map((p) => card(p, LANG)) } } }
}
