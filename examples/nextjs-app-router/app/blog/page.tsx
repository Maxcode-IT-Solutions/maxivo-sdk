import Link from "next/link"
import { maxivo } from "@/lib/maxivo"

export default async function BlogIndex() {
  const { items } = await maxivo.listBlogs({ lang: "en", pageSize: 12 })
  return (
    <ul>
      {items.map((b) => (
        <li key={b.slug}>
          <Link href={`/blog/${b.slug}`}>{b.title}</Link>
        </li>
      ))}
    </ul>
  )
}
