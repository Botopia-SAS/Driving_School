import React from "react";
import { useCancelPayment } from "../hooks/useCancelPayment";
import { CancelUI } from "./CancelUI";

export const CancelContent: React.FC = () => {
  const { state } = useCancelPayment();

  return <CancelUI state={state} />;
};
