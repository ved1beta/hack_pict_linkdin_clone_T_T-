export default function AnalyticsLoading() {
  return (
    <div className="bg-background min-h-screen py-6 animate-pulse">
      <div className="max-w-6xl mx-auto px-4 space-y-8">
        <div className="h-12 w-64 bg-secondary rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-36 bg-secondary rounded-xl" />
          ))}
        </div>
        <div className="h-64 bg-secondary rounded-xl" />
        <div className="h-48 bg-secondary rounded-xl" />
      </div>
    </div>
  );
}
