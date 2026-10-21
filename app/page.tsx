import { readdirSync } from "node:fs";
import { join } from "node:path";
import Link from "next/link";

function recipeNames(): string[] {
  return readdirSync(join(process.cwd(), "app"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => !name.startsWith("_") && !name.startsWith("("))
    .sort();
}

export default function Home() {
  return (
    <main>
      <h1 className="mb-4 text-2xl font-bold">AI SDK Recipes</h1>
      <ul className="list-disc pl-6">
        {recipeNames().map((name) => (
          <li key={name}>
            <Link className="underline" href={`/${name}`}>
              {name}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
