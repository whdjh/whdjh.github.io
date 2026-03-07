import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { AboutContent } from "@/components/about-content";

export default function HomePage() {
  const filePath = path.join(process.cwd(), "index.markdown");
  const raw = fs.readFileSync(filePath, "utf-8");
  const { content } = matter(raw);

  const transformed = content
    .replace(/\(\/pages\//g, "(/dev/")
    .replace(/\(\/others\//g, "(/dev/");

  return <AboutContent content={transformed} />;
}
