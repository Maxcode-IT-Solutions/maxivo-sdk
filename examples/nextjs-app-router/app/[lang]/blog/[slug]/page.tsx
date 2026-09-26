import { notFound } from "next/navigation"
import { RTL_LANGUAGES, type Language } from "@maxivo/sdk"
import { maxivo } from "@/lib/maxivo"

const LANGS = ["hi", "es", "zh", "ar", "fr", "pt", "de", "ja", "ko"] as const
export const dynamicParams = false
export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }))
}

export default async function TranslatedBlog({ params }: { params: { lang: Language; slug: string } }) {
  const blog = await maxivo.getBlog(params.slug, { lang: params.lang })
  if (!blog) notFound()
  return (
    <article lang={params.lang} dir={RTL_LANGUAGES.includes(params.lang) ? "rtl" : "ltr"}>
      <h1>{blog.title}</h1>
      <div className="cms-content" dangerouslySetInnerHTML={{ __html: blog.html }} />
    </article>
  )
}
