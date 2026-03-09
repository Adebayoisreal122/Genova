"use client";

import React from "react";
import ReactDOM from "react-dom";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl flex flex-col max-h-[90vh] relative">
        {/* Header Section - Fixed */}
        <div className="flex items-center justify-between p-6 border-b shrink-0">
          {title && (
            <h2 className="text-lg font-bold">{title}</h2>
          )}
          <button
            onClick={onClose}
            className="text-gray-900 hover:text-gray-700 text-xl ml-auto"
          >
            &times;
          </button>
        </div>

        {/* Content Section - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;