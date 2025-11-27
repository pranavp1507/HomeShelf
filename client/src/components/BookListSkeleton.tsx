import { Skeleton } from './ui';

const BookListSkeleton = () => {
  return (
    <div className="bg-surface rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[650px]">
          <thead className="bg-background-secondary border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary">Cover</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary">Title</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary">Author</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary">ISBN</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary">Categories</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary">Status</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-text-primary">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {[...Array(5)].map((_, index) => (
              <tr key={index} className="hover:bg-background-secondary transition-colors">
                <td className="px-4 py-3">
                  <Skeleton variant="rectangular" width={48} height={48} className="rounded" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton width="80%" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton width="60%" />
                </td>
                <td className="px-4 py-3">
                  <Skeleton width="90px" />
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <Skeleton width="60px" height="20px" className="rounded-full" />
                    <Skeleton width="50px" height="20px" className="rounded-full" />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Skeleton width="70px" height="20px" className="rounded-full" />
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

export default BookListSkeleton;
