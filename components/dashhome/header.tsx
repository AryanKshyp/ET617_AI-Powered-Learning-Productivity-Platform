export default function Header() {
  return (
    <header className="flex justify-between items-center px-8 py-4 bg-white shadow">
      <h1 className="text-2xl font-bold text-purple-700">ProLearn AI</h1>
      <nav className="flex gap-6">
        <a href="/dashboard" className="hover:text-purple-600">Dashboard</a>
      </nav>
    </header>
  );
}
