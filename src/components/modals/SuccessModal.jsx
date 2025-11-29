import React from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { CheckCircleIcon } from '@heroicons/react/outline';

/**
 * Success Modal component
 * Shows success message with consistent dark theme styling
 */
const SuccessModal = ({ isOpen, onClose, title, message }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="text-center py-4">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full mb-4" style={{ backgroundColor: '#ffc44d20' }}>
          <CheckCircleIcon className="h-6 w-6" style={{ color: '#ffc44d' }} />
        </div>
        <p className="text-gray-300 mb-6">{message}</p>
        <Button variant="primary" onClick={onClose} className="w-full">
          OK
        </Button>
      </div>
    </Modal>
  );
};

export default SuccessModal;