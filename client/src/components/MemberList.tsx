import { motion } from 'framer-motion';
import { Edit2, Trash2, ChevronUp, ChevronDown, Users, UserPlus } from 'lucide-react';
import { EmptyState } from './ui';

interface Member {
  id: number;
  name: string;
  email: string;
  phone?: string;
}

interface MemberListProps {
  members: Member[];
  onEdit: (member: Member) => void;
  onDelete: (id: number) => void;
  onAdd: () => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
}

interface SortableHeaderProps {
  label: string;
  columnId: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSort: (columnId: string) => void;
}

const SortableHeader = ({ label, columnId, sortBy, sortOrder, onSort }: SortableHeaderProps) => {
  const isActive = sortBy === columnId;

  return (
    <button
      onClick={() => onSort(columnId)}
      className="flex items-center gap-1 font-semibold text-text-primary hover:text-primary transition-colors"
    >
      {label}
      {isActive ? (
        sortOrder === 'asc' ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )
      ) : (
        <ChevronDown className="h-4 w-4 opacity-30" />
      )}
    </button>
  );
};

const MemberList = ({ members, onEdit, onDelete, onAdd, sortBy, sortOrder, onSortChange }: MemberListProps) => {
  const handleSortRequest = (columnId: string) => {
    const isAsc = sortBy === columnId && sortOrder === 'asc';
    onSortChange(columnId, isAsc ? 'desc' : 'asc');
  };

  if (members.length === 0) {
    return (
      <div className="bg-surface rounded-lg shadow-md">
        <EmptyState
          icon={Users}
          title="No Members Yet"
          description="Start growing your library community by adding your first member!"
          action={{
            label: 'Add First Member',
            onClick: onAdd,
            icon: <UserPlus className="h-5 w-5" />,
          }}
        />
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[500px]">
          <thead className="bg-background-secondary border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left text-sm">
                <SortableHeader
                  label="Name"
                  columnId="name"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSortRequest}
                />
              </th>
              <th className="px-4 py-3 text-left text-sm">
                <SortableHeader
                  label="Email"
                  columnId="email"
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  onSort={handleSortRequest}
                />
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-text-primary">Phone</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-text-primary">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {members.map((member, index) => (
                <motion.tr
                  key={member.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.2 }}
                  className="hover:bg-background-secondary transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-secondary font-semibold text-sm">
                          {member.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-text-primary font-medium">{member.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{member.email}</td>
                  <td className="px-4 py-3 text-text-secondary">{member.phone || 'N/A'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onEdit(member)}
                        className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        aria-label="Edit member"
                      >
                        <Edit2 className="h-4 w-4" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onDelete(member.id)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        aria-label="Delete member"
                      >
                        <Trash2 className="h-4 w-4" />
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MemberList;
