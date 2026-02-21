export default function ProjectsLoading() {
  return (
    <div className="bg-background min-h-screen py-6 animate-pulse">
      <div className="max-w-5xl mx-auto px-4 space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-10 w-48 bg-secondary rounded-xl mb-2" />
            <div className="h-4 w-64 bg-secondary rounded" />
          </div>
          <div className="h-10 w-32 bg-secondary rounded-lg" />
        </div>
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-secondary rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
