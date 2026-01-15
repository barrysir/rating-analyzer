import { Toast, Toaster, createToaster } from '@ark-ui/solid';
import { XIcon } from 'lucide-solid';
import './toast.css';

const toaster = createToaster({
  placement: 'bottom-start',
  gap: 24,
});

export function addToast(params: Parameters<typeof toaster.create>[0]) {
  toaster.create(params);
}

export function addWarningToast(params: Parameters<typeof toaster.create>[0]) {
  toaster.create({type: "warning", duration: 3000, ...params});
}

export function addErrorToast(params: Parameters<typeof toaster.create>[0]) {
  console.log("Creating", {type: "warning", duration: Infinity, ...params});
  toaster.create({type: "warning", duration: Infinity, ...params});
}

export function MyToaster() {
  return <Toaster toaster={toaster}>
    {(toast) => (
      <Toast.Root>
        <Toast.Title>{toast().title}</Toast.Title>
        <Toast.Description>{toast().description}</Toast.Description>
        <Toast.CloseTrigger>
          <XIcon />
        </Toast.CloseTrigger>
      </Toast.Root>
    )}
  </Toaster>;
}