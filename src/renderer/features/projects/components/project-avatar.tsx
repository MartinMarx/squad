import { observer } from 'mobx-react-lite';
import { useEffect, useState, type ReactNode } from 'react';
import { getRepositoryStore } from '@renderer/features/projects/stores/project-selectors';
import { cn } from '@renderer/utils/utils';
import { parseGitHubRepository } from '@shared/github-repository';

interface ProjectAvatarProps {
  projectId: string;
  /** Rendered when the project has no GitHub remote or the avatar fails to load. */
  fallback: ReactNode;
  /** Applied to the rendered `<img>` (size, rounding, positioning). */
  className?: string;
  /** Pixel size requested from GitHub. Defaults to `40` (covers retina at 16-20px). */
  pixelSize?: number;
  alt?: string;
}

/**
 * Renders the GitHub org/user avatar associated with a project's base remote,
 * falling back to the supplied node when the project is not a GitHub remote or
 * the avatar image fails to load.
 *
 * Triggers a one-time prefetch of the project's remote info so the avatar can
 * be shown before the user navigates into the project. Resource calls are
 * deduped/cached.
 */
export const ProjectAvatar = observer(function ProjectAvatar({
  projectId,
  fallback,
  className,
  pixelSize = 40,
  alt = '',
}: ProjectAvatarProps) {
  const repo = getRepositoryStore(projectId);

  useEffect(() => {
    void repo?.remoteData.load();
  }, [repo]);

  const owner = repo?.repositoryUrl
    ? (parseGitHubRepository(repo.repositoryUrl)?.owner ?? null)
    : null;

  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setFailed(false);
  }, [owner]);

  if (!owner || failed) return <>{fallback}</>;

  return (
    <img
      src={`https://github.com/${owner}.png?size=${pixelSize}`}
      alt={alt}
      referrerPolicy="no-referrer"
      loading="lazy"
      draggable={false}
      onError={() => setFailed(true)}
      className={cn('rounded-sm object-cover', className)}
    />
  );
});
