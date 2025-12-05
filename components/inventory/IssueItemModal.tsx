// components/inventory/IssueItemModal.tsx
"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@/components/common/ui/Modal";
import { FormCard, FormInput, FormDateInput, FormTextarea } from "@/components/common/form";
import { V_inventory_itemsRowSchema } from "@/schemas/zod-schemas";
import { formatCurrency } from "@/utils/formatters";
import { AlertCircle } from "lucide-react";
import { IssueItemFormData, issueItemSchema } from "@/hooks/inventory-actions";

interface IssueItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: V_inventory_itemsRowSchema | null;
  onSubmit: (data: IssueItemFormData) => void;
  isLoading: boolean;
}

export const IssueItemModal: React.FC<IssueItemModalProps> = ({
  isOpen,
  onClose,
  item,
  onSubmit,
  isLoading,
}) => {
  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<IssueItemFormData>({
    resolver: zodResolver(issueItemSchema),
    defaultValues: {
      quantity: 1,
      issued_date: new Date().toISOString().split("T")[0],
      issued_to: "",
      issue_reason: "",
    },
  });

  // Watch quantity to calculate live cost
  const quantityToIssue = watch("quantity");
  const currentStock = item?.quantity || 0;
  const unitCost = item?.cost || 0;
  const calculatedTotalCost = (quantityToIssue || 0) * unitCost;

  useEffect(() => {
    if (isOpen && item) {
      reset({
        item_id: item.id!,
        quantity: 1,
        issued_date: new Date().toISOString().split("T")[0],
        issued_to: "",
        issue_reason: "",
      });
    }
  }, [isOpen, item, reset]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Issue: ${item?.name}`} size="lg">
      <FormCard
        title="Issue Inventory"
        subtitle={`Current Stock: ${currentStock} | Unit Cost: ${formatCurrency(unitCost)}`}
        onSubmit={handleSubmit(onSubmit)}
        onCancel={onClose}
        isLoading={isLoading}
        submitText="Confirm Issue"
        standalone
      >
        <div className="space-y-6">
          {/* Live Calculation Box */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800 flex items-center justify-between">
             <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total Value to Deduct</p>
                <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {formatCurrency(calculatedTotalCost)}
                </p>
             </div>
             <div className="text-right">
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Remaining Stock</p>
                <p className={`text-xl font-bold ${currentStock - quantityToIssue < 0 ? 'text-red-500' : 'text-green-600'}`}>
                    {currentStock - quantityToIssue}
                </p>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              name="quantity"
              label="Quantity to Issue"
              type="number"
              register={register}
              error={errors.quantity}
              required
              max={currentStock} // Prevent HTML5 constraint validation from allowing higher
              min={1}
            />
            <FormDateInput
              name="issued_date"
              label="Date of Issue"
              control={control}
              error={errors.issued_date}
              required
            />
            <FormInput
              name="issued_to"
              label="Issued To (Person/Dept)"
              register={register}
              error={errors.issued_to}
              required
              placeholder="e.g. John Doe / Maintenance Team"
            />
          </div>

          <FormTextarea
            name="issue_reason"
            label="Reason / Work Order"
            control={control}
            error={errors.issue_reason}
            required
            placeholder="e.g. Replacement for broken fiber at Sector 4"
            rows={3}
          />

          {quantityToIssue > currentStock && (
             <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Cannot issue more than available stock ({currentStock}).</span>
             </div>
          )}
        </div>
      </FormCard>
    </Modal>
  );
};