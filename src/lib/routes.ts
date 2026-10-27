import type { Route } from "next";

// Static export has no dynamic segments without a known id list, so spot pages take ?id=.
export const spotHref = (id: string) => `/spot?id=${encodeURIComponent(id)}` as Route;
export const verifyHref = (id: string) => `/verify?id=${encodeURIComponent(id)}` as Route;
