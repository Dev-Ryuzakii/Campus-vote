import { Progress } from "@/components/ui/progress";

interface ResultBarProps {
  percentage: number;
}

export default function ResultBar({ percentage }: ResultBarProps) {
  // Determine color based on percentage value
  let barColor = "bg-blue-600";
  
  if (percentage >= 60) {
    barColor = "bg-green-600";
  } else if (percentage >= 30) {
    barColor = "bg-blue-600";
  } else {
    barColor = "bg-gray-400";
  }

  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5">
      <div 
        className={`h-2.5 rounded-full ${barColor}`} 
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
  );
}
