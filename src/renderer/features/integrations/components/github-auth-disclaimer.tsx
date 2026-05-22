import { Github } from 'lucide-react';
import { Button } from '@renderer/lib/ui/button';

export function GithubAuthDisclaimer({
  onOpenIntegrationSettings,
}: {
  onOpenIntegrationSettings: () => void;
}) {
  return (
    <div className="flex w-full flex-col items-center justify-center gap-5 rounded-md border border-dashed border-border p-8">
      <span className="relative flex size-8 items-center justify-center overflow-hidden rounded-full bg-background-2">
        <Github className="size-4 text-foreground-muted" />
      </span>
      <p className="text-center text-sm font-normal text-foreground-muted">
        GitHub is not connected. Connect GitHub to create a repository.
      </p>
      <Button type="button" variant="outline" size="xs" onClick={onOpenIntegrationSettings}>
        Open Integration Settings
      </Button>
    </div>
  );
}
