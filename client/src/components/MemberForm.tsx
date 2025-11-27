import { useState, useEffect } from 'react';
import { Modal, Button, Input } from './ui';
import { validateMemberName, validateEmail, validatePhone } from '../utils/validation';

interface Member {
  id?: number;
  name: string;
  email: string;
  phone?: string;
}

interface MemberFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (member: Member) => void;
  memberToEdit?: Member | null;
}

interface ValidationErrors {
  name?: string;
  email?: string;
  phone?: string;
}

const MemberForm = ({ open, onClose, onSubmit, memberToEdit }: MemberFormProps) => {
  const [member, setMember] = useState<Member>({ name: '', email: '', phone: '' });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    if (memberToEdit) {
      setMember(memberToEdit);
    } else {
      setMember({ name: '', email: '', phone: '' });
    }
    setErrors({});
    setTouched({});
  }, [memberToEdit, open]);

  const validateField = (name: string, value: string): string | null => {
    switch (name) {
      case 'name':
        return validateMemberName(value);
      case 'email':
        return validateEmail(value);
      case 'phone':
        return validatePhone(value);
      default:
        return null;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setMember((prevMember) => ({ ...prevMember, [name]: value }));

    // Real-time validation
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: error || undefined }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));

    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error || undefined }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const newErrors: ValidationErrors = {};
    newErrors.name = validateMemberName(member.name) || undefined;
    newErrors.email = validateEmail(member.email) || undefined;
    newErrors.phone = validatePhone(member.phone || '') || undefined;

    setErrors(newErrors);
    setTouched({ name: true, email: true, phone: true });

    // Check if there are any errors
    if (Object.values(newErrors).some((error) => error)) {
      return;
    }

    onSubmit(member);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={memberToEdit ? 'Edit Member' : 'Add New Member'}
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Name"
          name="name"
          type="text"
          value={member.name}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.name}
          required
          fullWidth
          autoFocus
        />

        <Input
          label="Email"
          name="email"
          type="email"
          value={member.email}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.email}
          required
          fullWidth
        />

        <Input
          label="Phone (optional)"
          name="phone"
          type="tel"
          value={member.phone || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          error={errors.phone}
          helperText="Enter your phone number with country code if applicable"
          fullWidth
        />

        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
          >
            {memberToEdit ? 'Save Changes' : 'Add Member'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default MemberForm;
