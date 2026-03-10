import { getStatusColor, getStatusLabel } from '../../utils/helpers';

const StatusBadge = ({ status, size = 'sm' }) => (
  <span className={`inline-flex items-center font-medium rounded-full ${size === 'sm' ? 'text-xs px-2.5 py-0.5' : 'text-sm px-3 py-1'} ${getStatusColor(status)}`}>
    {getStatusLabel(status)}
  </span>
);

export default StatusBadge;
