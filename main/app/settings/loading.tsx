export default function SettingsLoading() {
  return (
    <div className="bg-background min-h-screen py-6 animate-pulse">
      <div className="max-w-4xl mx-auto px-4 space-y-8">
        <div className="h-12 w-64 bg-secondary rounded-xl" />
        <div className="h-4 w-96 bg-secondary rounded" />
        <div className="space-y-6">
          <div className="h-40 bg-secondary rounded-xl" />
          <div className="h-40 bg-secondary rounded-xl" />
          <div className="h-40 bg-secondary rounded-xl" />
        </div>
      </div>
    </div>
  );
}
