import { useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Github, Loader2, Terminal } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@renderer/lib/hooks/use-toast';
import { type BaseModalProps } from '@renderer/lib/modal/modal-provider';
import { useGithubContext } from '@renderer/lib/providers/github-context-provider';
import { Button } from '@renderer/lib/ui/button';
import {
  DialogContentArea,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@renderer/lib/ui/dialog';

const ISSUE_CONNECTION_STATUS_QUERY_KEY = ['issues:connection-status'] as const;

export function GithubConnectModal({ onSuccess, onClose }: BaseModalProps<void>) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { checkStatus, handleGithubConnect } = useGithubContext();
  const [deviceLoading, setDeviceLoading] = useState(false);
  const [cliLoading, setCliLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const anyLoading = deviceLoading || cliLoading;

  const connectDeviceFlow = async () => {
    setError(null);
    setDeviceLoading(true);
    try {
      await handleGithubConnect();
      onSuccess();
    } finally {
      setDeviceLoading(false);
    }
  };

  const refreshCliAuth = async () => {
    setError(null);
    setCliLoading(true);
    try {
      const status = await checkStatus({ refresh: true });
      if (!status.authenticated || status.tokenSource !== 'cli') {
        setError('No GitHub CLI session found. Run gh auth login first.');
        return;
      }

      void queryClient.invalidateQueries({ queryKey: ISSUE_CONNECTION_STATUS_QUERY_KEY });
      toast({
        title: 'GitHub CLI detected',
        description: status.user ? `Using @${status.user.login} via GitHub CLI.` : undefined,
      });
      onSuccess();
    } finally {
      setCliLoading(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Connect GitHub</DialogTitle>
      </DialogHeader>
      <DialogContentArea className="gap-2">
        <div className="rounded-lg border border-border p-3">
          <div className="flex items-center gap-3">
            <Github className="text-muted-foreground h-4 w-4 shrink-0" />
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-medium text-foreground">GitHub device flow</h3>
              <p className="text-muted-foreground mt-0.5 text-xs">Sign in with your browser</p>
            </div>
            <Button onClick={() => void connectDeviceFlow()} disabled={anyLoading}>
              {deviceLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Connecting…
                </>
              ) : (
                'Connect'
              )}
            </Button>
          </div>
        </div>

        <div className="rounded-lg border border-border p-3">
          <div className="flex items-center gap-3">
            <Terminal className="text-muted-foreground h-4 w-4 shrink-0" />
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-medium text-foreground">GitHub CLI</h3>
              <p className="text-muted-foreground mt-0.5 text-xs">
                Run{' '}
                <code className="rounded bg-background-1 px-1 py-0.5 font-mono text-[11px] text-foreground">
                  gh auth login
                </code>{' '}
                in your terminal
              </p>
            </div>
            <Button variant="outline" onClick={() => void refreshCliAuth()} disabled={anyLoading}>
              {cliLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Checking…
                </>
              ) : (
                'Refresh'
              )}
            </Button>
          </div>
          {error && <InlineError message={error} />}
        </div>
      </DialogContentArea>
      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={anyLoading}>
          Cancel
        </Button>
      </DialogFooter>
    </>
  );
}

function InlineError({ message }: { message: string }) {
  return (
    <div className="bg-destructive/10 text-destructive mt-2 flex items-start gap-1.5 rounded-md px-2.5 py-2 text-xs">
      <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
