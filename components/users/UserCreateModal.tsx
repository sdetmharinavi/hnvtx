import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/common/ui/select/Select';
import { Modal } from '@/components/common/ui/Modal/Modal';
import { FormCard, FormInput } from '@/components/common/form';
import { v4 as uuidv4 } from 'uuid';

const userSchema = z.object({
  id: z.uuid().optional(),
  email: z.email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  role: z.string().min(1, 'Role is required'),
  email_confirm: z.boolean().catch(false),
});

type UserFormData = z.infer<typeof userSchema>;

interface UserCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: UserFormData) => Promise<void>;
  isLoading: boolean;
}

export function UserCreateModal({
  isOpen,
  onClose,
  onCreate,
  isLoading,
}: UserCreateModalProps) {
  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      id: '',
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      role: 'viewer',
      email_confirm: false,
    },
  });

  const {
    register,
    handleSubmit,
    control,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    formState: { errors, isDirty, isValid },
    reset,
  } = form;

  const onValidSubmit = async (data: UserFormData) => {
    try {
      // Auto-generate UUID if not provided
      const payload = {
        ...data,
        id: data.id && data.id.trim() !== '' ? data.id : uuidv4(),
      };

      await onCreate(payload);
      reset();
      onClose();
    } catch (error: unknown) {
      console.error('Error creating user:', error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New User" visible={false}
      className="transparent bg-gray-700 rounded-2xl">
      <FormCard
        title="Create New User"
        onCancel={onClose}
        onSubmit={handleSubmit(onValidSubmit)}
        isLoading={isLoading}
        standalone
      >
        <div className="space-y-4">
          {/* Optional ID */}
          <FormInput
            name="id"
            label="User ID (optional)"
            placeholder="Leave blank to auto-generate"
            register={register}
            error={errors.id}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormInput
              name="first_name"
              label="First Name"
              register={register}
              error={errors.first_name}
              required
            />
            <FormInput
              name="last_name"
              label="Last Name"
              register={register}
              error={errors.last_name}
              required
            />
          </div>

          <FormInput
            name="email"
            placeholder="user@example.com"
            label="Email"
            error={errors.email}
            register={register}
            required
          />

          <FormInput
            name="password"
            type="password"
            placeholder="••••••••"
            label="Password"
            error={errors.password}
            register={register}
            required
          />

          {/* Role Select with Controller */}
          <Controller
            control={control}
            name="role"
            defaultValue="viewer" // ✅ add this
            render={({ field }) => (
              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="admin_pro">Admin PRO</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="maan_admin">MAAN Admin</SelectItem>
                    <SelectItem value="sdh_admin">SDH Admin</SelectItem>
                    <SelectItem value="asset_admin">Asset Admin</SelectItem>
                    <SelectItem value="mng_admin">MNG Admin</SelectItem>
                  </SelectContent>
                </Select>
                {errors.role && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.role.message}
                  </p>
                )}
              </div>
            )}
          />

          {/* Email Confirm Checkbox */}
          <Controller
            control={control}
            name="email_confirm"
            defaultValue={false} // ✅ add this
            render={({ field }) => (
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  className="h-4 w-4"
                />
                <span className="text-sm">Confirm Email Immediately</span>
              </label>
            )}
          />
        </div>
      </FormCard>
    </Modal>
  );
}
