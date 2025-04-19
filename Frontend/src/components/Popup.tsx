import React from 'react';

interface PopupProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  primaryButton: {
    text: string;
    onClick: () => void;
  };
  secondaryButton?: {
    text: string;
    onClick: () => void;
  };
}

const Popup: React.FC<PopupProps> = ({
  isOpen,
  onClose,
  title,
  message,
  primaryButton,
  secondaryButton
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
        <h3 className="text-lg font-bold mb-2">{title}</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          {secondaryButton && (
            <button
              className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              onClick={secondaryButton.onClick}
            >
              {secondaryButton.text}
            </button>
          )}
          <button
            className="px-4 py-2 rounded-lg text-gray-800 transition-colors"
            style={{
              backgroundColor: "#FBC700",
              boxShadow: "0 4px 12px rgba(251, 199, 0, 0.3)",
            }}
            onClick={primaryButton.onClick}
          >
            {primaryButton.text}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Popup;
