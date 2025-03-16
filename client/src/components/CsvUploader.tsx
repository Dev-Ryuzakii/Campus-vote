import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface CsvUploaderProps {
  electionId: number;
}

export default function CsvUploader({ electionId }: CsvUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (csvData: string) => {
      return await apiRequest('POST', '/api/admin/voters/upload', { csvData, electionId });
    },
    onSuccess: (response) => {
      response.json().then((data) => {
        toast({
          title: "Success",
          description: data.message,
        });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/voters'] });
      });
      setFile(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to upload voter data. Please check your CSV format.",
        variant: "destructive",
      });
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "Error",
        description: "Please select a CSV file to upload",
        variant: "destructive",
      });
      return;
    }

    if (!electionId) {
      toast({
        title: "Error",
        description: "Please select an election first",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        if (event.target?.result) {
          const csvData = event.target.result as string;
          await uploadMutation.mutateAsync(csvData);
        }
        setUploading(false);
      };
      reader.onerror = () => {
        toast({
          title: "Error",
          description: "Failed to read the CSV file",
          variant: "destructive",
        });
        setUploading(false);
      };
      reader.readAsText(file);
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <Input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          disabled={uploading}
        />
        <Button 
          onClick={handleUpload}
          disabled={!file || uploading}
        >
          {uploading ? (
            <div className="flex items-center">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              <span>Uploading...</span>
            </div>
          ) : (
            "Upload"
          )}
        </Button>
      </div>
      {file && (
        <p className="text-sm text-gray-500">
          Selected file: {file.name} ({Math.round(file.size / 1024)} KB)
        </p>
      )}
      <div className="text-sm text-gray-500">
        <p className="font-medium">CSV format example:</p>
        <pre className="bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
          studentId,name,department<br/>
          STU10001,John Smith,Computer Science<br/>
          STU10002,Maria Garcia,Biology<br/>
          ...
        </pre>
      </div>
    </div>
  );
}
