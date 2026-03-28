import fs from "fs";
import path from "path";
import matter from "gray-matter";

/** MDX posts under `content/posts/` in this repo. */
const POSTS_DIR = path.join(process.cwd(), "content", "posts");

export interface PostMeta {
  slug: string;
  title: string;
  date: string;
  description?: string;
  tags?: string[];
  featured?: boolean;
  hasSimulation?: boolean;
  readingTime?: string;
}

export interface Post extends PostMeta {
  content: string;
}

function calcReadingTime(content: string): string {
  const words = content.trim().split(/\s+/).length;
  const mins = Math.max(1, Math.round(words / 200));
  return `${mins} min read`;
}

export function getAllPosts(): PostMeta[] {
  if (!fs.existsSync(POSTS_DIR)) return [];
  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith(".mdx") || f.endsWith(".md"));
  return files
    .map((file) => {
      const slug = file.replace(/\.(mdx|md)$/, "");
      const raw = fs.readFileSync(path.join(POSTS_DIR, file), "utf8");
      const { data, content } = matter(raw);
      return {
        slug,
        title: data.title ?? slug,
        date: data.date ?? "2025-01-01",
        description: data.description,
        tags: data.tags ?? [],
        featured: data.featured ?? false,
        hasSimulation: data.hasSimulation ?? false,
        readingTime: calcReadingTime(content),
      } as PostMeta;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getFeaturedPosts(limit = 5): PostMeta[] {
  return getAllPosts()
    .filter((p) => p.featured)
    .slice(0, limit);
}

export function getRecentPosts(limit = 5): PostMeta[] {
  return getAllPosts().slice(0, limit);
}

export function getPost(slug: string): Post | null {
  const extensions = [".mdx", ".md"];
  for (const ext of extensions) {
    const filePath = path.join(POSTS_DIR, `${slug}${ext}`);
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf8");
      const { data, content } = matter(raw);
      return {
        slug,
        title: data.title ?? slug,
        date: data.date ?? "2025-01-01",
        description: data.description,
        tags: data.tags ?? [],
        featured: data.featured ?? false,
        hasSimulation: data.hasSimulation ?? false,
        readingTime: calcReadingTime(content),
        content,
      };
    }
  }
  return null;
}
