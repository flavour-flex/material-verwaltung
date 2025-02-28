export function Table({ children, ...props }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
      <table className="min-w-full divide-y divide-gray-200" {...props}>
        <thead className="bg-primary/5">
          {/* ... Tabellenkopf ... */}
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {children}
        </tbody>
      </table>
    </div>
  );
} 