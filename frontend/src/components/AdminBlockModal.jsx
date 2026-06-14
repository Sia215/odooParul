import { ShieldAlert } from 'lucide-react';

export default function AdminBlockModal() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-red-100 rounded-full mb-4">
          <ShieldAlert size={28} className="text-red-500" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Admin Access Required</h2>
        <p className="text-sm text-gray-500">
          This section is restricted to administrators only. Contact your manager for access.
        </p>
      </div>
    </div>
  );
}
