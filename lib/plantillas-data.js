// Solo se usa dentro de getStaticProps / getStaticPaths (no viaja al navegador).
import data from '../data/plantillas.json'
export const families = data.families
export const products = data.products
export const generated = data.generated
export const card = (p, lang) => ({ id: p.id, title: p.title[lang], who: p.who[lang], price: p.price, slug: p.slug[lang], cover: p.img[lang].cover })
export const famOf = (p) => families.find((f) => f.id === p.family)
