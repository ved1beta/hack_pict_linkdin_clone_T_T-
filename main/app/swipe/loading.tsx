export default function SwipeLoading() {
  return (
    <div className="bg-background min-h-screen py-6 animate-pulse">
      <div className="max-w-2xl mx-auto px-4">
        <div className="h-12 w-48 bg-secondary rounded-xl mb-6" />
        <div className="h-[500px] bg-secondary rounded-xl" />
      </div>
    </div>
  );
}
