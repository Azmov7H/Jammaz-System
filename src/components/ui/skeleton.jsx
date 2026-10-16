import { cn } from '@/utils'

function Skeleton({
  className,
  ...props
}) {
  return (
    <div
      role="presentation"
      aria-hidden="true"
      data-slot="skeleton"
      className={cn("bg-accent animate-pulse rounded-md", className)}
      {...props} />
  );
}

export { Skeleton }
