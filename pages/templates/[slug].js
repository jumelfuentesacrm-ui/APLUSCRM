import { Product } from '../../components/Tienda'
import { products, card, famOf } from '../../lib/plantillas-data'
const LANG = 'en', OTHER = 'es'
export default function Page(props) { return <Product lang={LANG} {...props} /> }
export function getStaticPaths() { return { paths: products.map((p) => ({ params: { slug: p.slug[LANG] } })), fallback: false } }
export function getStaticProps({ params }) {
  const p = products.find((x) => x.slug[LANG] === params.slug), f = famOf(p)
  return { props: {
    altSlug: p.slug[OTHER], family: { slug: f.slug[LANG], name: f.name[LANG], summary: f.summary[LANG] },
    related: products.filter((x) => x.family === p.family && x.id !== p.id).slice(0, 3).map((x) => card(x, LANG)),
    p: { id: p.id, slug: p.slug[LANG], title: p.title[LANG], who: p.who[LANG], price: p.price, pages: p.pages[LANG], cover: p.img[LANG].cover, preview: p.img[LANG].preview,
      lists: p.lists.map((l) => ({ label: l.label[LANG], items: l.items.map((i) => i[LANG]) })), tips: p.tips.map((x) => x[LANG]), contents: p.contents[LANG] },
  } }
}
