import { Skeleton } from "../ui";

function SidebarSkeleton() {
  const skeletonContacts = Array(8).fill(null);
  return (
    <aside
      className="flex h-full w-full shrink-0 flex-col border-r border-line bg-surface lg:w-[360px]"
    >
      <div className="w-full border-b border-line px-4 pb-4 pt-5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <Skeleton className="h-5 w-20 rounded-control" />
            <Skeleton className="mt-2 h-3 w-28 rounded-control" />
          </div>
          <Skeleton className="size-10 rounded-control" />
        </div>
        <Skeleton className="mt-5 h-10 w-full rounded-control" />
        <Skeleton className="mt-3 h-10 w-full rounded-control" />
      </div>

      <div className="w-full overflow-y-auto py-2">
        {skeletonContacts.map((_, idx) => (
          <div key={idx} className="flex w-full items-center gap-3 px-3 py-2.5">
            <Skeleton className="size-12 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 border-b border-line py-2">
              <Skeleton className="mb-2 h-3.5 w-32 rounded-control" />
              <Skeleton className="h-3 w-20 rounded-control" />
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

export default SidebarSkeleton;
