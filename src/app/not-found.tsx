import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-wrap mx-auto px-4 py-16 text-center">
      <p className="font-display font-bold text-2xl mb-2">Bulunamadı</p>
      <p className="text-sm text-muted mb-6">Aradığın yemek burada değil.</p>
      <Link href="/" className="text-sm underline">
        Tüm yemeklere dön
      </Link>
    </div>
  );
}
