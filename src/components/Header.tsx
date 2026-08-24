import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b border-line">
      <div className="max-w-wrap mx-auto px-4 py-4 flex items-baseline justify-between gap-3">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-display font-bold text-xl tracking-tight">
            Hangi Şehrin?
          </span>
        </Link>
        <span className="text-xs sm:text-sm text-muted italic">
          Memleketinin lezzetine sahip çık.
        </span>
      </div>
    </header>
  );
}
