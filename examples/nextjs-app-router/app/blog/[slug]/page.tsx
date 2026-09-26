import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { hreflangAlternates } from "@maxivo/sdk/seo"
import { maxivo } from "@/lib/maxivo"

type Props = { params: { slug: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const blog = await maxivo.getBlog(params.slug, { lang: "en" })
  if (!blog) return {}
  return {
    title: blog.seoTitle,
    description: blog.seoDescription,
    alternates: { languages: hreflangAlternates(blog) },
    openGraph: blog.coverUrl ? { images: [blog.coverUrl] } : undefined,
  }
}

export default async function BlogPage({ params }: Props) {
  const blog = await maxivo.getBlog(params.slug, { lang: "en" })
  if (!blog) notFound()
  return (
    <article>
      <h1>{blog.title}</h1>
      <div className="cms-content" dangerouslySetInnerHTML={{ __html: blog.html }} />
    </article>
  )
}
