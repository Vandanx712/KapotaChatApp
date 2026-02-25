import { MessageSquarePlusIcon, Search, Users } from "lucide-react";
import React from "react";

function SidebarSkeleton() {
  const skeletonContacts = Array(8).fill(null);
  return (
    <aside
      className="h-full w-full lg:w-[350px] border-r border-base-300 
    flex flex-col transition-all duration-200"
    >
      {/* Header */}
      <div className="border-b border-base-300 w-full p-5">
        <div className="flex items-center justify-between gap-2">
          <Users className={`size-6`} />
          <MessageSquarePlusIcon className={`size-6`} />
        </div>
        <div className="mt-6">
          <label className="flex items-center justify-center gap-2 input input-bordered input-md w-full">
            <Search className="size-5" />
            <input type="text" placeholder="Search Conversation" className=" w-full" />
          </label>
        </div>
      </div>

      {/* Skeleton Contacts */}
      <div className="overflow-y-auto w-full py-3">
        {skeletonContacts.map((_, idx) => (
          <div key={idx} className="w-full p-3 flex items-center gap-3">
            {/* Avatar skeleton */}
            <div className="relative mx-auto lg:mx-0">
              <div className="skeleton size-12 rounded-full" />
            </div>

            {/* User info skeleton - only visible on larger screens */}
            <div className="text-left min-w-0 flex-1">
              <div className="skeleton h-4 w-32 mb-2" />
              <div className="skeleton h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

export default SidebarSkeleton;
