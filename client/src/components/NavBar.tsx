import { Button } from "@/components/ui/button";

interface NavBarProps {
  onLogout: () => void;
  title?: string;
}

export default function NavBar({ onLogout, title = "Campus Vote" }: NavBarProps) {
  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-blue-600 font-bold text-xl">{title}</span>
            </div>
          </div>
          <div className="flex items-center">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onLogout}
              className="ml-3 inline-flex items-center"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
