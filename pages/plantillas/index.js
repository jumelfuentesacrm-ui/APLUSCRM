import { Hub } from '../../components/Tienda'
import { families, products, card } from '../../lib/plantillas-data'
const LANG = 'es'
export default function Page(props) { return <Hub lang={LANG} {...props} /> }
export function getStaticProps() {
  return { props: { families: families.map((f) => ({ id: f.id, slug: f.slug[LANG], name: f.name[LANG], summary: f.summary[LANG], items: products.filter((p) => p.family === f.id).map((p) => card(p, LANG)) })) } }
}
