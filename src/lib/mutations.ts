import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { toast } from 'sonner';

interface ToastMutationOptions<TVars, TResult> {
  mutationFn: (vars: TVars) => Promise<TResult>;
  /** Các query cần làm mới khi thành công. */
  invalidate: QueryKey[];
  /** Thông báo thành công (chuỗi hoặc hàm theo tham số). */
  success?: string | ((vars: TVars, result: TResult) => string);
  onDone?: (result: TResult) => void;
}

/** Mutation dùng chung: làm mới dữ liệu, báo thành công/lỗi bằng toast (giống cách bản gốc làm). */
export function useToastMutation<TVars, TResult = unknown>({ mutationFn, invalidate, success, onDone }: ToastMutationOptions<TVars, TResult>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (result, vars) => {
      invalidate.forEach((queryKey) => qc.invalidateQueries({ queryKey }));
      if (success) toast.success(typeof success === 'function' ? success(vars, result) : success);
      onDone?.(result);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
