import Link from "next/link";

export default function NotFound() {
  return (
    <div className="card mx-auto mt-10 flex max-w-md flex-col items-center gap-3 p-8 text-center">
      <h1 className="text-2xl font-semibold">Not found</h1>
      <p className="text-sm text-muted">That page or wall does not exist. In demo mode, data may have reset.</p>
      <Link href="/listings" className="btn-primary">
        Browse open walls
      </Link>
    </div>
  );
}
