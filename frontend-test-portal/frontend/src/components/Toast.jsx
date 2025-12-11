import { useEffect } from 'react';

/**
 * Toast Component
 * Displays a list of toast notifications fixed to the top-right or bottom-right.
 * 
 * Props:
 * - toasts: Array of toast objects { id, message, type: 'success'|'error'|'info' }
 * - removeToast: Function to remove a toast by ID
 */
export default function ToastContainer({ toasts, removeToast }) {
    if (!toasts || toasts.length === 0) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} removeToast={removeToast} />
            ))}
        </div>
    );
}

function ToastItem({ toast, removeToast }) {
    useEffect(() => {
        const timer = setTimeout(() => {
            removeToast(toast.id);
        }, 4000); // Auto dismiss after 4 seconds

        return () => clearTimeout(timer);
    }, [toast.id, removeToast]);

    const bgColors = {
        success: 'bg-emerald-600',
        error: 'bg-rose-600',
        info: 'bg-indigo-600',
        warning: 'bg-amber-500'
    };

    const icons = {
        success: '✅',
        error: '⚠️',
        info: 'ℹ️',
        warning: '🚧'
    };

    return (
        <div className={`${bgColors[toast.type] || bgColors.info} text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 min-w-[300px] max-w-md animate-slide-in pointer-events-auto transition-all transform hover:scale-105`}>
            <span className="text-xl">{icons[toast.type]}</span>
            <p className="font-medium text-sm">{toast.message}</p>
            <button
                onClick={() => removeToast(toast.id)}
                className="ml-auto text-white/60 hover:text-white"
            >
                ✕
            </button>
        </div>
    );
}
