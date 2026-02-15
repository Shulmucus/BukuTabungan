import { cn } from '@/lib/utils';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { HiXMark } from 'react-icons/hi2';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

const sizeMap = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
};

export function Modal({ isOpen, onClose, title, children, size = 'md', className }: ModalProps) {
    const overlayRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen || !mounted) return null;

    return createPortal(
        <div
            ref={overlayRef}
            className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in"
            onClick={(e) => {
                if (e.target === overlayRef.current) onClose();
            }}
        >
            {/* Modal card */}
            <div
                className={cn(
                    'relative w-full bg-white rounded-2xl shadow-2xl animate-scale-in',
                    sizeMap[size],
                    className,
                )}
            >
                {title && (
                    <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100">
                        <h3 className="text-lg font-semibold text-surface-900">{title}</h3>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 transition-colors"
                        >
                            <HiXMark className="w-5 h-5" />
                        </button>
                    </div>
                )}
                <div className="p-6">{children}</div>
            </div>
        </div>,
        document.body
    );
}
