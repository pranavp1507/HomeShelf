import { Skeleton } from './ui';

const MemberListSkeleton = () => {
  return (
    <div className="bg-surface rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[500px]">
          <thead className="bg-background-secondary border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary">Name</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary">Email</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary">Phone</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-text-primary">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {[...Array(5)].map((_, index) => (
              <tr key={index} className="hover:bg-background-secondary transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Skeleton variant="circular" width={40} height={40} />
                    <Skeleton width="150px" />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Skeleton width="180px" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton width="120px" />
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Skeleton variant="circular" width={32} height={32} />
                    <Skeleton variant="circular" width={32} height={32} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MemberListSkeleton;
