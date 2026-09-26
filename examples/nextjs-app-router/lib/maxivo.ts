import { createMaxivoClient } from "@maxivo/sdk"

export const maxivo = createMaxivoClient({
  baseUrl: process.env.MAXIVO_URL!,
  projectKey: "nexiify",
  token: process.env.MAXIVO_TOKEN!,
  next: { revalidate: 300, tags: ["maxivo"] },
})
