"use client";

import { Search } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";

const GlobalSearch = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setQuery(params.get("search") || "");
  }, [pathname]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams(window.location.search);
    if (query) {
      params.set("search", query);
    } else {
      params.delete("search");
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="hidden md:flex items-center gap-2 rounded-full border bg-background px-3 py-1 w-full max-w-sm"
      role="search"
    >
      <Search className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      <Input
        type="search"
        placeholder="Search current page..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="border-0 shadow-none focus-visible:ring-0 h-8 px-0"
        aria-label="Search current page"
      />
    </form>
  );
};

export default GlobalSearch;
