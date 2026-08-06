import { CheckCircle2, CircleAlert, Info, XCircle } from "lucide-react";
import { Toaster } from "react-hot-toast";

const toastIcons = {
  success: <CheckCircle2 className="size-5 text-success" />,
  error: <XCircle className="size-5 text-danger" />,
  loading: <Info className="size-5 text-brand" />,
  blank: <CircleAlert className="size-5 text-muted" />,
};

export default function ToastViewport() {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      containerStyle={{ top: 18, right: 18 }}
      toastOptions={{
        duration: 3500,
        className: "kapota-toast",
        style: {
          background: "rgb(var(--color-surface-raised))",
          color: "rgb(var(--color-ink))",
          border: "1px solid rgb(var(--color-line))",
          borderRadius: "var(--radius-app)",
          boxShadow: "var(--shadow-panel)",
          fontSize: "14px",
          maxWidth: "420px",
          padding: "12px 14px",
        },
        success: { icon: toastIcons.success },
        error: { icon: toastIcons.error },
        loading: { icon: toastIcons.loading },
        blank: { icon: toastIcons.blank },
      }}
    />
  );
}
