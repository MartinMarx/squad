import { useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { ISSUE_CONNECTION_STATUS_QUERY_KEY } from '@renderer/features/integrations/integrations-provider';
import { ProviderLogo } from '@renderer/features/tasks/components/issue-selector/issue-selector';
import { useToast } from '@renderer/lib/hooks/use-toast';
import { rpc } from '@renderer/lib/ipc';
import { type BaseModalProps } from '@renderer/lib/modal/modal-provider';
import { Button } from '@renderer/lib/ui/button';
import {
  DialogContentArea,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@renderer/lib/ui/dialog';

export function LinearConnectModal({ onSuccess, onClose }: BaseModalProps<void>) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectOAuth = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await rpc.linear.connectOAuth();
      if (!result.success) {
        setError(result.error ?? 'Connection failed. Please try again.');
        return;
      }

      void queryClient.invalidateQueries({ queryKey: ISSUE_CONNECTION_STATUS_QUERY_KEY });
      toast({
        title: 'Connected to Linear',
        description: result.workspaceName
          ? `Signed in to ${result.workspaceName}`
          : 'Signed in to Linear',
      });
      onSuccess();
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) {
      void rpc.linear.cancelOAuth();
    }
    onClose();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Connect Linear</DialogTitle>
      </DialogHeader>
      <DialogContentArea className="gap-2">
        <div className="rounded-lg border border-border p-3">
          <div className="flex items-center gap-3">
            <ProviderLogo provider="linear" className="h-4 w-4 shrink-0" />
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-medium text-foreground">Linear OAuth</h3>
              <p className="text-muted-foreground mt-0.5 text-xs">
                Sign in with your browser using Linear&apos;s official MCP authentication
              </p>
            </div>
            <Button onClick={() => void connectOAuth()} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Connecting…
                </>
              ) : (
                'Connect'
              )}
            </Button>
          </div>
          {error ? (
            <div className="bg-destructive/10 text-destructive mt-2 flex items-start gap-1.5 rounded-md px-2.5 py-2 text-xs">
              <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}
        </div>
      </DialogContentArea>
      <DialogFooter>
        <Button variant="outline" onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
      </DialogFooter>
    </>
  );
}
