/** React Query hooks for trading operations */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  marketSell,
  setTakeProfit,
  cancelTakeProfit,
  setStopLoss,
  removeStopLoss,
  editOrder,
  cancelOrder,
} from "@/services/api/trading";
import toast from "react-hot-toast";

type TradingError = Error & { response?: { data?: { detail?: string } } };

function getErrorMessage(error: TradingError): string {
  return error.response?.data?.detail || error.message || "Trading operation failed";
}

/** Market sell mutation */
export function useMarketSell() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: marketSell,
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
    },
    onError: (error: TradingError) => {
      toast.error(getErrorMessage(error));
    },
  });
}

/** Set take profit mutation */
export function useSetTakeProfit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: setTakeProfit,
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
    },
    onError: (error: TradingError) => {
      toast.error(getErrorMessage(error));
    },
  });
}

/** Cancel take profit mutation */
export function useCancelTakeProfit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelTakeProfit,
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
    },
    onError: (error: TradingError) => {
      toast.error(getErrorMessage(error));
    },
  });
}

/** Set stop loss mutation */
export function useSetStopLoss() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: setStopLoss,
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
    },
    onError: (error: TradingError) => {
      toast.error(getErrorMessage(error));
    },
  });
}

/** Remove stop loss mutation */
export function useRemoveStopLoss() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeStopLoss,
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
    },
    onError: (error: TradingError) => {
      toast.error(getErrorMessage(error));
    },
  });
}

/** Edit order price mutation */
export function useEditOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, newPrice }: { orderId: string; newPrice: number }) =>
      editOrder(orderId, { new_price: newPrice }),
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
    },
    onError: (error: TradingError) => {
      toast.error(getErrorMessage(error));
    },
  });
}

/** Cancel order mutation */
export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelOrder,
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
    },
    onError: (error: TradingError) => {
      toast.error(getErrorMessage(error));
    },
  });
}
