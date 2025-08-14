// components/users/StatusBadge.tsx

const StatusBadge = ({ status }: { status: string }) => {
  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return {
          bg: "bg-green-100",
          text: "text-green-800",
          dot: "bg-green-500",
        };
      case "inactive":
        return { bg: "bg-gray-100", text: "text-gray-800", dot: "bg-gray-500" };
      case "suspended":
        return { bg: "bg-red-100", text: "text-red-800", dot: "bg-red-500" };
      case "pending":
        return {
          bg: "bg-yellow-100",
          text: "text-yellow-800",
          dot: "bg-yellow-500",
        };
      default:
        return { bg: "bg-gray-100", text: "text-gray-800", dot: "bg-gray-500" };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${config.dot}`}></span>
      {status}
    </span>
  );
};

export default StatusBadge;
