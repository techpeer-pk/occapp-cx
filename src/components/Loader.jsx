/**
 * Generic skeleton loader for data-fetching states.
 *
 * Usage:
 *   <Loader />              — 6 rows (default), full card wrapper
 *   <Loader rows={3} />     — custom row count
 *   <Loader inline />       — no card wrapper (use inside an existing card)
 */
export default function Loader({ rows = 6, inline = false }) {
  const skeleton = (
    <div>
      {/* Fake table header */}
      <div className="flex gap-6 px-4 py-3 bg-gray-50 border-b border-gray-100">
        {[56, 96, 80, 112, 72, 64].map((w, i) => (
          <div
            key={i}
            className="h-2.5 bg-gray-200 rounded animate-pulse"
            style={{ width: w }}
          />
        ))}
      </div>

      {/* Fake rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 px-4 py-3.5 border-b border-gray-50 last:border-0 animate-pulse"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <div className="h-4 w-14 bg-gray-100 rounded" />
          <div className="h-4 w-28 bg-gray-100 rounded" />
          <div className="h-4 flex-1 bg-gray-100 rounded" />
          <div className="h-5 w-20 bg-gray-100 rounded-full" />
          <div className="h-5 w-16 bg-gray-100 rounded-full" />
        </div>
      ))}
    </div>
  )

  if (inline) return skeleton

  return (
    <div className="card p-0 overflow-hidden">
      {skeleton}
    </div>
  )
}
