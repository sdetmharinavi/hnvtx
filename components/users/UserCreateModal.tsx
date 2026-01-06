// components/users/UserCreateModal.tsx
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
import { FormInput } from '@/components/common/form';
import { v4 as uuidv4 } from 'uuid';
import { BaseFormModal } from '@/components/common/form/BaseFormModal'; // IMPORT

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

export function UserCreateModal({ isOpen, onClose, onCreate, isLoading }: UserCreateModalProps) {
  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      id: '',
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      role: 'mng_admin',
      email_confirm: false,
    },
  });

  const {
    register,
    control,
    formState: { errors },
    reset,
  } = form;

  const onValidSubmit = async (data: UserFormData) => {
    try {
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
    <BaseFormModal
      isOpen={isOpen}
      onClose={onClose}
      title="User"
      isEditMode={false}
      isLoading={isLoading}
      form={form}
      onSubmit={onValidSubmit}
      widthClass="max-w-lg"
    >
      <div className="space-y-4">
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

        <Controller
          control={control}
          name="role"
          defaultValue="mng_admin"
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
                  <SelectItem value="ofc_admin">OFC Admin</SelectItem>
                  <SelectItem value="maan_admin">MAAN Admin</SelectItem>
                  <SelectItem value="sdh_admin">SDH Admin</SelectItem>
                  <SelectItem value="asset_admin">Asset Admin</SelectItem>
                  <SelectItem value="mng_admin">MNG Admin</SelectItem>
                </SelectContent>
              </Select>
              {errors.role && <p className="text-sm text-red-500 mt-1">{errors.role.message}</p>}
            </div>
          )}
        />

        <Controller
          control={control}
          name="email_confirm"
          defaultValue={false}
          render={({ field }) => (
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Confirm Email Immediately
              </span>
            </label>
          )}
        />
      </div>
    </BaseFormModal>
  );
}
