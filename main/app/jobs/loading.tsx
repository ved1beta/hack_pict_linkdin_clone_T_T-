export default function JobsLoading() {
  return (
    <div className="bg-background min-h-screen py-6 animate-pulse">
      <div className="max-w-6xl mx-auto px-4 space-y-6">
        <div className="h-12 w-48 bg-secondary rounded-xl" />
        <div className="grid gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-secondary rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
